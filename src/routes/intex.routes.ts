import { Router } from "express"
import authRoutes from "./auth.routes.js";
import linkedinRoutes from "./linkedin.routes.js";
import postRoutes from "./post.routes.js"
const routes = Router();

routes.use('/users',authRoutes)
routes.use('/linkedin',linkedinRoutes)
routes.use('/post',postRoutes)

export default routes;