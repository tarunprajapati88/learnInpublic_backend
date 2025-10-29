// models/ScheduledPost.ts - SIMPLIFIED VERSION
import { Schema, model, Document, Types } from 'mongoose';

export interface IScheduledPost extends Document {
  _id: string;
  userId: Types.ObjectId;  // Just store the user ID
  platform: 'linkedin' | 'x' | 'hashnode';
  content: string;
  postTime: Date;
  status: 'pending' | 'posted' | 'failed';
  postedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledPostSchema = new Schema<IScheduledPost>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  platform: { 
    type: String, 
    enum: ['linkedin', 'x', 'hashnode'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 3000
  },
  postTime: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'posted', 'failed'], 
    default: 'pending' 
  },
  postedAt: { 
    type: Date 
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for cron job queries
scheduledPostSchema.index({ status: 1, postTime: 1 });
scheduledPostSchema.index({ userId: 1, createdAt: -1 });

export const ScheduledPost = model<IScheduledPost>('ScheduledPost', scheduledPostSchema);