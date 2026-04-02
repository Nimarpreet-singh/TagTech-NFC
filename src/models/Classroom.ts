import mongoose, { Schema, Document, models } from 'mongoose'

export interface IClassroom extends Document {
  name: string
  identifier: string  // URL-safe identifier like "room-101" - FIXED URL path
  studentSlug: string
  teacherSlug: string
  teacherEmails: string[]  // Array of teacher emails assigned to this classroom
  createdAt: Date
}

const ClassroomSchema = new Schema<IClassroom>({
  name: { type: String, required: true },
  identifier: { type: String, required: true, unique: true },
  studentSlug: { type: String, required: true, unique: true, sparse: true },
  teacherSlug: { type: String, required: true, unique: true, sparse: true },
  teacherEmails: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
})

export const Classroom = models.Classroom || mongoose.model<IClassroom>('Classroom', ClassroomSchema)
