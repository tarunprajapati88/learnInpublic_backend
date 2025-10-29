import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import{ LinkedInIntegration } from '../models/linkedInIntegration.models.js';



interface TokenPayload {
 _id: string;
  email: string;
}

/**
 * Step 1: Initiate LinkedIn OAuth
 * Flutter calls this endpoint with JWT token
 */
export const initiateLinkedInAuth = async (req: Request, res: Response) => {

  try {

    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
    const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;
    console.log(' LinkedIn OAuth initiated');
    
    // Get JWT token from query parameter (sent by Flutter)
    const token = req.query.token as string;
    
    if (!token) {
      console.log(' No token provided');
      return res.redirect('learninpublic://callback?success=false&error=missing_token');
    }
    
    // Verify JWT token and extract userId
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
      userId = decoded._id;
      console.log(`Token verified for user: ${userId}`);
    } catch (error) {
      console.log('Invalid token');
      return res.redirect('learninpublic://callback?success=false&error=invalid_token');
    }
    
    // Create state parameter with userId (for CSRF protection)
    const state = Buffer.from(JSON.stringify({ 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');
    console.log("CLIENT_ID:",process.env.LINKEDIN_CLIENT_ID);

    // Build LinkedIn authorization URL
    const linkedinAuthUrl = 
      `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&`+
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${REDIRECT_URI}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent('openid profile w_member_social')}`;
    
    console.log('🔗 Redirecting to LinkedIn...');
    
    // Redirect user's browser to LinkedIn
    res.redirect(linkedinAuthUrl);
    
  } catch (error: any) {
    console.error(' Initiate auth error:', error.message);
    res.redirect('learninpublic://callback?success=false&error=server_error');
  }
};

/**
 * Step 2: Handle LinkedIn callback
 * LinkedIn redirects here after user approves
 */
export const handleLinkedInCallback = async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;
  
  console.log('LinkedIn callback received');
  
  // Handle OAuth errors
  if (error) {
    console.log(`LinkedIn OAuth error: ${error} - ${error_description}`);
    return res.redirect(`learninpublic://callback?success=false&error=${error}`);
  }
  
  if (!code || !state) {
    console.log('Missing code or state parameter');
    return res.redirect('learninpublic://callback?success=false&error=missing_params');
  }
  
  try {
     
    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
    const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;
    // Decode state to get userId
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;
    
    console.log(`Processing callback for user: ${userId}`);
    console.log(`Authorization code: ${(code as string).substring(0, 20)}...`);
    
    // Exchange authorization code for access token
    console.log('Exchanging code for tokens...');
    
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${REDIRECT_URI}`,
          client_id: `${CLIENT_ID}`,
          client_secret: `${CLIENT_SECRET}`,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { 
      access_token, 
      refresh_token, 
      expires_in 
    } = tokenResponse.data;
    
    console.log('Tokens received from LinkedIn');
    console.log(`Access token expires in: ${expires_in} seconds (${Math.floor(expires_in / 86400)} days)`);

    // Get LinkedIn user profile
    console.log('👤 Fetching LinkedIn profile...');
    
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    const { sub: linkedInUrn, name, email } = profileResponse.data;
    
    console.log(`Profile fetched`);
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   URN: ${linkedInUrn}`);

    // Save credentials to database using YOUR model
    console.log(' Saving credentials to database...');
    
    const integration = await LinkedInIntegration.findOneAndUpdate(
      { userId, urn: linkedInUrn },
      {
        userId,
        urn: linkedInUrn,
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      { 
        upsert: true,  // Create if doesn't exist, update if exists
        new: true       // Return updated document
      }
    );

    console.log('LinkedIn integration saved successfully!');
    console.log(`Document ID: ${integration._id}`);
    console.log(` User ${userId} connected LinkedIn account ${linkedInUrn}`);

    // Redirect back to Flutter app with success
    res.redirect('learninpublic://callback?success=true');
    
  } catch (error: any) {
    console.error(' Callback error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('LinkedIn API Error:', JSON.stringify(error.response.data, null, 2));
    }
    
    res.redirect('learninpublic://callback?success=false&error=connection_failed');
  }
};

/**
 * Get LinkedIn connection status
 */
 export const getLinkedInStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    
    console.log(` Checking LinkedIn status for user: ${userId}`);
    
    const integration = await LinkedInIntegration.findOne({ userId });
    
    if (integration) {
      console.log(` User ${userId} has LinkedIn connected (URN: ${integration.urn})`);
      
      res.json({
        connected: true,
        urn: integration.urn,
        connectedAt: integration.createdAt
      });
    } else {
      console.log(`ℹ User ${userId} has not connected LinkedIn`);
      
      res.json({ 
        connected: false 
      });
    }
  } catch (error: any) {
    console.error(' Status check error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get LinkedIn status' 
    });
  }
};

/**
 * Disconnect LinkedIn account
 */

export const disconnectLinkedIn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    
    console.log(`Disconnecting LinkedIn for user: ${userId}`);
    
    const result = await LinkedInIntegration.deleteMany({ userId });
    
    console.log(`Deleted ${result.deletedCount} LinkedIn integration(s)`);
    
    res.json({ 
      success: true, 
      message: 'LinkedIn account disconnected',
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('Disconnect error:', error.message);
    res.status(500).json({ 
      error: 'Failed to disconnect LinkedIn' 
    });
  }
}; 
