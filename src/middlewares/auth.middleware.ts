import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

interface JwtPayloadWithId extends JwtPayload {
  _id: string;
  email: string;
  username?: string;
  name?: string;
}

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
    
    
    if (!token) {
      throw new ApiError(401, "Not authorized, token missing");
    }
 
  const decodeToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayloadWithId;

    // Check if _id exists in token
    if (!decodeToken._id) {
      throw new ApiError(401, "Invalid token payload - missing user ID");
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(decodeToken._id)) {
      throw new ApiError(401, "Invalid user ID format in token");
    }
    
    const user = await User.findById(decodeToken._id).select("-password -refreshTokens");
    
    if (!user) {
      throw new ApiError(401, "Not authorized, user not found");
    }
    (req as any).user = user;

    next();

  } 
  catch (error) {
 
   // console.error("Error type:", error.constructor.name);
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, `Invalid token: ${error.message}`);
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token expired");
    }
    throw new ApiError(401, "Not authorized, invalid token");
  }
});
