import mongoose, { Schema, Document, models } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'teacher'
  classroomIds: string[]  // Array of classroom IDs teacher can manage
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher'], required: true },
  classroomIds: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
})

export const User = models.User || mongoose.model<IUser>('User', UserSchema)
