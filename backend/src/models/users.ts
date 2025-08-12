// User model
// Define the structure of user data (e.g., database schemas)

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  profilePicture: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  profilePicture: {
    type: String,
    required: true,
    validate: {
      validator: function(url: string): boolean {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
      },
      message: 'Invalid profile picture URL'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
UserSchema.index({ googleId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Static methods
UserSchema.statics.findByGoogleId = function(googleId: string) {
  return this.findOne({ googleId });
};

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Instance methods
UserSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    profilePicture: this.profilePicture,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model<IUser>('User', UserSchema);
