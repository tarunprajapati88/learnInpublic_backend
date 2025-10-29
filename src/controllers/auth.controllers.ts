import { Request, Response } from 'express';
import { User } from '../models/user.models.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { TokenService } from '../services/refreshToken.services.js';
import { TIME_CONSTANTS } from '../constants.js';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const newUser = await User.create({
    username,
    email,
    password,
  });

  // Get device type from header (default: web)
  const deviceType = (req.headers['x-device-type'] as 'web' | 'mobile') || 'web';

  // Generate access token
  const accessToken = newUser.generateAccessToken();

  // Create refresh token with device info
  const refreshTokenDoc = await TokenService.createRefreshToken(newUser._id, deviceType);

  const createdUser = await User.findById(newUser._id).select("-password");
  if (!createdUser) throw new ApiError(500, "User creation failed, please try again");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: TIME_CONSTANTS.REFRESH_TOKEN_COOKIE_MAX_AGE // 30 days
  };

  return res.status(201)
    .cookie('refreshToken', refreshTokenDoc.token, options)
    .cookie('accessToken', accessToken, { 
      ...options, 
      maxAge: TIME_CONSTANTS.ACCESS_TOKEN_COOKIE_MAX_AGE // 7 days
    })
    .json(new ApiResponse(201, "User registered successfully", {
      createdUser,
      accessToken,
      deviceName: refreshTokenDoc.deviceName
    }));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new ApiError(400, "User does not exist with this email");
  }
  
  const isPasswordCorrect = await existingUser.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid credentials");
  }

  // Get device type from header (default: web)
  const deviceType = (req.headers['x-device-type'] as 'web' | 'mobile') || 'web';

  // Generate access token
  const accessToken = existingUser.generateAccessToken();

  // Create refresh token with device info
  const refreshTokenDoc = await TokenService.createRefreshToken(existingUser._id, deviceType);

  const loggedInUser = await User.findById(existingUser._id).select("-password");
  if (!loggedInUser) throw new ApiError(500, "User login failed, please try again");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: TIME_CONSTANTS.REFRESH_TOKEN_COOKIE_MAX_AGE // 30 days
  };

  return res.status(200)
    .cookie('refreshToken', refreshTokenDoc.token, options)
    .cookie('accessToken', accessToken, { 
      ...options, 
      maxAge: TIME_CONSTANTS.ACCESS_TOKEN_COOKIE_MAX_AGE // 7 days
    })
    .json(new ApiResponse(200, "User logged in successfully", {
      loggedInUser,
      accessToken,
      deviceName: refreshTokenDoc.deviceName
    }));
});



export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken || 
    req.headers?.authorization?.replace("Bearer ", "");

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    // Validate the token first
    const tokenData = await TokenService.validateRefreshToken(incomingRefreshToken);
    
    if (!tokenData) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Rotate the refresh token
    const rotatedToken = await TokenService.rotateRefreshToken(incomingRefreshToken);

    // Get user and generate new access token
    const user = await User.findById(rotatedToken.userId).select("-password");
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const newAccessToken = user.generateAccessToken();

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const
    };

    return res.status(200)
      .cookie('refreshToken', rotatedToken.token, {
        ...options,
        maxAge: TIME_CONSTANTS.REFRESH_TOKEN_COOKIE_MAX_AGE // 30 days
      })
      .cookie('accessToken', newAccessToken, {
        ...options,
        maxAge:   TIME_CONSTANTS.ACCESS_TOKEN_COOKIE_MAX_AGE // 7 days
      })
      .json(new ApiResponse(200, "Tokens refreshed successfully", {
        accessToken: newAccessToken,
        deviceName: rotatedToken.deviceName
      }));

  } catch (error: any) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});


export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚪 LOGOUT PROCESS STARTED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const refreshToken = req.cookies?.refreshToken;
  const userId = (req as any).user?._id;
  
  // Log 1: Check if token exists in cookies
  console.log('📋 Cookie Check:');
  console.log('  - Refresh token exists:', !!refreshToken);
  console.log('  - User ID:', userId);
  
  if (refreshToken) {
    console.log('  - Token preview:', refreshToken.substring(0, 30) + '...');
    console.log('  - Token length:', refreshToken.length);
    console.log('  - Token type:', typeof refreshToken);
  } else {
    console.log('  ⚠️ No refresh token found in cookies');
  }
  
  // Log 2: Check database before removal
  if (userId) {
    const userBefore = await User.findById(userId).select('email refreshTokens');
    console.log('\n📊 Database BEFORE removal:');
    console.log('  - User email:', userBefore?.email);
    console.log('  - Total tokens in DB:', userBefore?.refreshTokens.length);
    
    if (userBefore && userBefore.refreshTokens.length > 0) {
      console.log('  - Tokens preview:');
      userBefore.refreshTokens.forEach((token, index) => {
        const matches = token === refreshToken;
        console.log(`    ${index + 1}. ${token.substring(0, 30)}... ${matches ? '✅ MATCH' : ''}`);
      });
    }
  }

  // Log 3: Attempt to revoke token
  if (refreshToken) {
    console.log('\n🗑️  Attempting to revoke token...');
    const removed = await TokenService.revokeToken(refreshToken);
    console.log('  - Revoke result:', removed ? '✅ SUCCESS' : '❌ FAILED');
    
    // Log 4: Check database after removal
    if (userId) {
      const userAfter = await User.findById(userId).select('email refreshTokens');
      console.log('\n📊 Database AFTER removal:');
      console.log('  - Total tokens in DB:', userAfter?.refreshTokens.length);
      
      if (userAfter && userAfter.refreshTokens.length > 0) {
        console.log('  - Remaining tokens:');
        userAfter.refreshTokens.forEach((token, index) => {
          console.log(`    ${index + 1}. ${token.substring(0, 30)}...`);
        });
      } else {
        console.log('  - ✅ All tokens removed from database');
      }
    }
  }

  // Log 5: Clear cookies
  console.log('\n🍪 Clearing cookies...');
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/' // Important for clearing
  };

  console.log('  - Cookie options:', {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite
  });

  console.log('\n✅ LOGOUT COMPLETED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});


export const logoutFromAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  
  // Revoke all refresh tokens for this user
  await TokenService.revokeAllUserTokens(userId);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "Logged out from all devices successfully"));
});

export const getActiveSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  
  // Get all active sessions for this user
  const sessions = await TokenService.getUserSessions(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Active sessions retrieved successfully", sessions));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", user));
});
