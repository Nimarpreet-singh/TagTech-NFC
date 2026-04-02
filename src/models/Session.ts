import mongoose, { Schema, Document, models } from 'mongoose'

export interface ISession extends Document {
  classroomId: string
  url: string
  activatedBy: string
  activatedAt: Date
  expiresAt: Date | null   // null = no expiry
  tapCount: number
}

const SessionSchema = new Schema<ISession>({
  classroomId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  activatedBy: { type: String, required: true },
  activatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  tapCount: { type: Number, default: 0 },
})

// TTL index: MongoDB auto-deletes expired sessions
// (only triggers when expiresAt is set)
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true })

export const Session = models.Session || mongoose.model<ISession>('Session', SessionSchema)
