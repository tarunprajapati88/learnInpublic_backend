
import { Schema, model, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  userId: string;
  deviceName: string; 
  deviceType: 'web' | 'mobile';
  expiresAt: Date;
  lastUsed: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  deviceName: { type: String, required: true }, 
  deviceType: { 
    type: String, 
    enum: ['web', 'mobile'],
    default: 'web'
  },
  expiresAt: { type: Date, required: true },
  lastUsed: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
