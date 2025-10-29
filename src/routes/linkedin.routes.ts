import { Router } from "express";
import {
    initiateLinkedInAuth,
    handleLinkedInCallback,
    getLinkedInStatus,
    disconnectLinkedIn

} from "../controllers/linkedin.controllers.ts";
import { verifyJWT } from "../middlewares/auth.middleware.ts";

const linkedinRoutes = Router();

linkedinRoutes.get('/auth', initiateLinkedInAuth);
linkedinRoutes.get('/callback', handleLinkedInCallback);
linkedinRoutes.get('/status', verifyJWT,getLinkedInStatus);
linkedinRoutes.post('/disconnect', verifyJWT,disconnectLinkedIn)



export default linkedinRoutes;
