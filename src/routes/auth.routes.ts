import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    logoutFromAllDevices,
    getActiveSessions,
    refreshAccessToken,
    getCurrentUser
} 
from "../controllers/auth.controllers.ts";
import { verifyJWT } from "../middlewares/auth.middleware.ts";

const   authRoutes = Router();

authRoutes.post('/register',registerUser);
authRoutes.post('/login',loginUser);
authRoutes.post('/logout',verifyJWT,logoutUser);
authRoutes.post('/logout-all',verifyJWT,logoutFromAllDevices);
authRoutes.get('/sessions',verifyJWT,getActiveSessions);
authRoutes.post('/refresh-Accesstoken',refreshAccessToken);
authRoutes.get('/me',verifyJWT,getCurrentUser);

export default authRoutes;