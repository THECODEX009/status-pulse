import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'Admin' | 'Engineer' | 'Viewer';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: Types.ObjectId;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Engineer', 'Viewer'],
      default: 'Viewer',
      required: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Password should not be returned in standard queries by default
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.refreshToken;
  return user;
};

export const User = model<IUser>('User', UserSchema);
