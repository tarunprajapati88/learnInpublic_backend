// models/LinkedInIntegration.ts
import { Schema, model, Document,Types} from 'mongoose';

export interface ILinkedInIntegration extends Document {
  _id: string;
  userId: Types.ObjectId;
  urn: string;
  accessToken: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const linkedinIntegrationSchema = new Schema<ILinkedInIntegration>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  urn: { 
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
linkedinIntegrationSchema.index({ userId: 1, urn: 1 }, { unique: true });

export const LinkedInIntegration = model<ILinkedInIntegration>('LinkedInIntegration', linkedinIntegrationSchema);