
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  username?: string;
  profilePic?: string;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  generateRefreshToken(): string;
  generateAccessToken(): string;
  isPasswordCorrect(password: string): Promise<boolean>;
  
}

const userSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  username: { 
    type: String, 
    trim: true ,
    required: true
  },
  profilePic: { 
    type: String 
  },
  refreshTokens: [{ 
    type: String 
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  }});

userSchema.methods.isPasswordCorrect = async function (password:string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (){
  return jwt.sign(
    {
      _id: this._id as string,
      email: this.email,
    },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as any}
  )
}

userSchema.methods.generateRefreshToken = function (){
  return jwt.sign(
    { _id: this._id as string, },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as any}
  )
}

export const User = model<IUser>('User', userSchema);