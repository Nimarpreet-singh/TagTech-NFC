// Run: node scripts/fix_classroom_slugs.js
// Fills missing studentSlug/teacherSlug and ensures indexes.

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI not set in .env.local')
  }

  const conn = await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })

  const ClassroomSchema = new mongoose.Schema({
    name: String,
    identifier: String,
    studentSlug: String,
    teacherSlug: String,
    teacherEmails: [String],
    createdAt: Date,
  })

  const Classroom = mongoose.models.Classroom || mongoose.model('Classroom', ClassroomSchema)

  console.log('Updating classrooms with null slugs...')
  await Classroom.updateMany({ teacherSlug: null }, [{ $set: { teacherSlug: { $concat: ['$identifier', '-teacher'] } } }])
  await Classroom.updateMany({ studentSlug: null }, [{ $set: { studentSlug: '$identifier' } }])

  console.log('Fixing existing undefined slugs (non-null), fallback to identifier…')
  await Classroom.updateMany({ teacherSlug: { $exists: false } }, [{ $set: { teacherSlug: { $concat: ['$identifier', '-teacher'] } } }])
  await Classroom.updateMany({ studentSlug: { $exists: false } }, [{ $set: { studentSlug: '$identifier' } }])

  console.log('Ensuring indexes...')
  try {
    await Classroom.collection.createIndex({ teacherSlug: 1 }, { unique: true, sparse: true })
  } catch (ex) {
    console.log('teacherSlug index exists, skipping', ex.message)
  }
  try {
    await Classroom.collection.createIndex({ studentSlug: 1 }, { unique: true, sparse: true })
  } catch (ex) {
    console.log('studentSlug index exists, skipping', ex.message)
  }

  console.log('Done!')
  await conn.disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
