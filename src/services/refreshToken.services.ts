// services/tokenService.ts
import { User } from '../models/user.models.js';
import jwt from 'jsonwebtoken';

interface DeviceInfo {
  token: string;
  deviceName: string;
  deviceType: 'web' | 'mobile';
  createdAt: Date;
  lastUsed: Date;
}

export class TokenService {
  

  // Generate device name automatically
  static async generateDeviceName(userId: string, deviceType: 'web' | 'mobile') {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Count existing devices of this type
    const existingDeviceCount = user.refreshTokens.length;
    const deviceCount = existingDeviceCount + 1;
    const typeLabel = deviceType === 'web' ? 'Web App' : 'Mobile App';
    
    return `${typeLabel} ${deviceCount}`;
  }

  // Create and store refresh token
  static async createRefreshToken(userId: string, deviceType: 'web' | 'mobile' = 'web') {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Generate refresh token using user method
    const token = user.generateRefreshToken();
    const deviceName = await this.generateDeviceName(userId, deviceType);

    // Add token to user's refreshTokens array
    user.refreshTokens.push(token);
    await user.save({ validateBeforeSave: false });

    return {
      token,
      userId: user._id,
      deviceName,
      deviceType,
      createdAt: new Date(),
      lastUsed: new Date()
    };
  }

  // Rotate refresh token
  static async rotateRefreshToken(oldToken: string) {
    const user = await User.findOne({ 
      refreshTokens: { $in: [oldToken] }
    });

    if (!user) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new token
    const newToken = user.generateRefreshToken();

    // Replace old token with new token in array
    const tokenIndex = user.refreshTokens.indexOf(oldToken);
    if (tokenIndex > -1) {
      user.refreshTokens[tokenIndex] = newToken;
      await user.save({ validateBeforeSave: false });
    }

    // For device info, we'll use a simple approach since we're storing in array
    const deviceCount = tokenIndex + 1;
    const deviceName = `Web App ${deviceCount}`; // Simple naming

    return {
      token: newToken,
      userId: user._id,
      deviceName,
      deviceType: 'web' as const
    };
  }

  // Validate refresh token
  static async validateRefreshToken(token: string) {
    const user = await User.findOne({
      refreshTokens: { $in: [token] }
    });

    if (!user) {
      return null;
    }

    return {
      token,
      userId: user._id,
      deviceName: 'Web App', // Simple since we're using array
      deviceType: 'web' as const,
      lastUsed: new Date()
    };
  }


static async revokeToken(token: string) {
  console.log('  🔍 Inside revokeToken function');
  
  if (!token) {

    return false;
  }
  
  try {
    // Find user with this token
    const user = await User.findOne({ refreshTokens: token });
    
    if (!user) {

      
      // Additional debug - check all users
      const totalUsers = await User.countDocuments();
      console.log(`  ℹ️  Total users in database: ${totalUsers}`);
      
      return false;
    }
    

    
    // Check if token exists
    const tokenIndex = user.refreshTokens.indexOf(token);

    
    if (tokenIndex === -1) {

      return false;
    }
    
    // Remove the token
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    await user.save({ validateBeforeSave: false });

    
    return true;
  } catch (error) {

    return false;
  }
}


  // Revoke all user tokens
  static async revokeAllUserTokens(userId: string) {
    await User.findByIdAndUpdate(
      userId,
      { $set: { refreshTokens: [] } }
    );
  }

  // Get user active sessions (simplified since we're using array)
  static async getUserSessions(userId: string) {
    const user = await User.findById(userId).select('refreshTokens');
    if (!user) return [];

    // Since we're storing tokens in array, we'll return simplified session info
    return user.refreshTokens.map((token, index) => ({
      deviceName: `Web App ${index + 1}`,
      deviceType: 'web' as const,
      lastUsed: new Date(), // We can't track this with array approach
      createdAt: new Date(), // We can't track this with array approach
      sessionId: token.substring(0, 8) + '...' // Show partial token for identification
    }));
  }

  // Additional method to clean up invalid tokens
  static async cleanupUserTokens(userId: string) {
    const user = await User.findById(userId);
    if (!user) return;

    // Verify each token and remove invalid ones
    const validTokens: string[] = [];
    
    for (const token of user.refreshTokens) {
      try {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
        validTokens.push(token);
      } catch (error) {
        // Token is invalid/expired, don't add to validTokens
        console.log('Removing expired token');
      }
    }

    // Update user with only valid tokens
    user.refreshTokens = validTokens;
    await user.save({ validateBeforeSave: false });
  }
}
