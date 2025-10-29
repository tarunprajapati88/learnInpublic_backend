
// models/XIntegration.ts
import { Schema, model, Document,Types } from 'mongoose';

export interface IXIntegration extends Document {
  _id: string;
  userId: Types.ObjectId;
  xUserId: string;
  accessToken: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const xIntegrationSchema = new Schema<IXIntegration>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  xUserId: { 
    type: String, 
    required: true 
  },
  accessToken: { 
    type: String, 
    required: true 
  },
  refreshToken: { 
    type: String 
  }
}, {
  timestamps: true
});

// Create unique compound index
xIntegrationSchema.index({ userId: 1, xUserId: 1 }, { unique: true });

export const XIntegration = model<IXIntegration>('XIntegration', xIntegrationSchema);
