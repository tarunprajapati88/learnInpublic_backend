import { Router } from "express";
import {
    initiateLinkedInAuth,
    handleLinkedInCallback,
    getLinkedInStatus,
    disconnectLinkedIn

} from "../controllers/linkedin.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const linkedinRoutes = Router();

linkedinRoutes.get('/auth', initiateLinkedInAuth);
linkedinRoutes.get('/callback', handleLinkedInCallback);
linkedinRoutes.get('/status', verifyJWT,getLinkedInStatus);
linkedinRoutes.post('/disconnect', verifyJWT,disconnectLinkedIn)



export default linkedinRoutes;
