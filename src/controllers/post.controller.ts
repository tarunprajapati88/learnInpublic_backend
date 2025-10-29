// src/controllers/post.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/AsyncHandler.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { GeminiService } from '../services/gemini.service.ts';
import { ScheduledPost } from '../models/schedulePost.models.ts';

const geminiService = new GeminiService();

/**
 * Generate LinkedIn posts from prompt using AI
 */
export const generatePosts = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, platform = 'linkedin' } = req.body;
  const userId = (req as any).user._id;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new ApiError(400, 'Prompt is required');
  }

  if (prompt.length > 1000) {
    throw new ApiError(400, 'Prompt must be under 1000 characters');
  }

  console.log('📝 Generating posts for user:', userId);
  console.log('📝 Prompt:', prompt);

  try {
    // Generate posts using Gemini
    const generatedPosts = await geminiService.generateLinkedInPosts(prompt);

    if (!generatedPosts || generatedPosts.length === 0) {
      throw new ApiError(500, 'Failed to generate posts');
    }

    // Calculate schedule times (1 day apart)
    const now = new Date();
    const scheduledPosts = [];

    for (let i = 0; i < generatedPosts.length; i++) {
      const postTime = new Date(now);
      postTime.setDate(postTime.getDate() + i); // Add i days
      postTime.setHours(10, 0, 0, 0); // Schedule at 10 AM each day

      const scheduledPost = await ScheduledPost.create({
        userId,
        platform,
        content: generatedPosts[i],
        postTime,
        status: 'pending',
      });

      scheduledPosts.push(scheduledPost);
    }

    console.log(`✅ Created ${scheduledPosts.length} scheduled post(s)`);

    return res.status(201).json(
      new ApiResponse(201, 'Posts generated and scheduled successfully', {
        totalPosts: scheduledPosts.length,
        posts: scheduledPosts,
      })
    );
  } catch (error: any) {
    console.error('❌ Error generating posts:', error);
    throw new ApiError(500, error.message || 'Failed to generate posts');
  }
});

/**
 * Get all scheduled posts for current user with pagination
 */
export const getScheduledPosts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  
  // Pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Filters
  const { status, platform } = req.query;

  // Validate pagination
  if (page < 1) {
    throw new ApiError(400, 'Page number must be greater than 0');
  }

  if (limit < 1 || limit > 100) {
    throw new ApiError(400, 'Limit must be between 1 and 100');
  }

  // Build filter
  const filter: any = { userId };

  if (status && ['pending', 'posted', 'failed'].includes(status as string)) {
    filter.status = status;
  }

  if (platform && ['linkedin', 'x', 'hashnode'].includes(platform as string)) {
    filter.platform = platform;
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  try {
    // Get total count for pagination metadata
    const totalCount = await ScheduledPost.countDocuments(filter);
    
    // Get paginated posts
    const posts = await ScheduledPost.find(filter)
      .sort({ postTime: 1 }) // Sort by post time (oldest first)
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log(`✅ Retrieved ${posts.length} posts (Page ${page}/${totalPages})`);

    return res.status(200).json(
      new ApiResponse(200, 'Scheduled posts retrieved successfully', {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
        },
      })
    );
  } catch (error: any) {
    console.error('❌ Error fetching posts:', error);
    throw new ApiError(500, 'Failed to fetch scheduled posts');
  }
});

/**
 * Get single scheduled post
 */
export const getScheduledPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = (req as any).user._id;

  const post = await ScheduledPost.findOne({ _id: postId, userId });

  if (!post) {
    throw new ApiError(404, 'Scheduled post not found');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Scheduled post retrieved successfully', post)
  );
});

/**
 * Update post content
 */
export const updatePostContent = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = (req as any).user._id;

  if (!content || typeof content !== 'string') {
    throw new ApiError(400, 'Content is required');
  }

  if (content.length > 3000) {
    throw new ApiError(400, 'Content must be under 3000 characters');
  }

  const post = await ScheduledPost.findOne({ _id: postId, userId });

  if (!post) {
    throw new ApiError(404, 'Scheduled post not found');
  }

  if (post.status === 'posted') {
    throw new ApiError(400, 'Cannot update already posted content');
  }

  post.content = content;
  await post.save();

  console.log(`✅ Updated content for post: ${postId}`);

  return res.status(200).json(
    new ApiResponse(200, 'Post content updated successfully', post)
  );
});

/**
 * Update post schedule time
 */
export const updatePostTime = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { postTime } = req.body;
  const userId = (req as any).user._id;

  if (!postTime) {
    throw new ApiError(400, 'Post time is required');
  }

  const newPostTime = new Date(postTime);

  if (isNaN(newPostTime.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  if (newPostTime < new Date()) {
    throw new ApiError(400, 'Post time cannot be in the past');
  }

  const post = await ScheduledPost.findOne({ _id: postId, userId });

  if (!post) {
    throw new ApiError(404, 'Scheduled post not found');
  }

  if (post.status === 'posted') {
    throw new ApiError(400, 'Cannot reschedule already posted content');
  }

  post.postTime = newPostTime;
  await post.save();

  console.log(`✅ Updated schedule time for post: ${postId}`);

  return res.status(200).json(
    new ApiResponse(200, 'Post schedule updated successfully', post)
  );
});

/**
 * Delete scheduled post
 */
export const deleteScheduledPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = (req as any).user._id;

  const post = await ScheduledPost.findOne({ _id: postId, userId });

  if (!post) {
    throw new ApiError(404, 'Scheduled post not found');
  }

  if (post.status === 'posted') {
    throw new ApiError(400, 'Cannot delete already posted content');
  }

  await post.deleteOne();

  console.log(`✅ Deleted scheduled post: ${postId}`);

  return res.status(200).json(
    new ApiResponse(200, 'Scheduled post deleted successfully')
  );
});

/**
 * Get post statistics
 */
export const getPostStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  const stats = await ScheduledPost.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {
    pending: 0,
    posted: 0,
    failed: 0,
  };

  stats.forEach((stat) => {
    statsMap[stat._id as keyof typeof statsMap] = stat.count;
  });

  const total = statsMap.pending + statsMap.posted + statsMap.failed;

  return res.status(200).json(
    new ApiResponse(200, 'Post statistics retrieved successfully', {
      total,
      pending: statsMap.pending,
      posted: statsMap.posted,
      failed: statsMap.failed,
    })
  );
});

/**
 * Get recent posts (last 5)
 */
export const getRecentPosts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const limit = parseInt(req.query.limit as string) || 5;

  if (limit < 1 || limit > 20) {
    throw new ApiError(400, 'Limit must be between 1 and 20');
  }

  const posts = await ScheduledPost.find({ userId })
    .sort({ createdAt: -1 }) // Most recent first
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(200, 'Recent posts retrieved successfully', {
      posts,
      count: posts.length,
    })
  );
});
