import { Router } from "express"
import authRoutes from "./auth.routes.ts";
import linkedinRoutes from "./linkedin.routes.ts";
import postRoutes from "./post.routes.ts"
const routes = Router();

routes.use('/users',authRoutes)
routes.use('/linkedin',linkedinRoutes)
routes.use('/post',postRoutes)

export default routes;