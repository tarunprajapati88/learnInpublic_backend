// src/routes/post.routes.ts

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  generatePosts,
  getScheduledPosts,
  getScheduledPost,
  updatePostContent,
  updatePostTime,
  deleteScheduledPost,
  getPostStats,
  getRecentPosts
} from "../controllers/post.controller.js";

const postRoutes = Router();


postRoutes.post("/generate", verifyJWT, generatePosts);


postRoutes.get("/scheduled", verifyJWT, getScheduledPosts);


postRoutes.get("/:postId", verifyJWT, getScheduledPost);


postRoutes.patch("/:postId/updatecontent", verifyJWT, updatePostContent);


postRoutes.patch("/:postId/upadtetime", verifyJWT, updatePostTime);


postRoutes.delete("/:postId/delete", verifyJWT, deleteScheduledPost);


postRoutes.get("/stats/all", verifyJWT, getPostStats);


postRoutes.get("/recent/all", verifyJWT, getRecentPosts);

export default postRoutes;
