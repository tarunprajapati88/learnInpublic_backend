// models/Subscription.ts
import { Schema, model, Document,Types } from 'mongoose';

export interface ISubscription extends Document {
  _id: string;
  userId:  Types.ObjectId;
  plan: 'free' | 'premium';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  plan: { 
    type: String, 
    enum: ['free', 'premium'], 
    default: 'free' 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);