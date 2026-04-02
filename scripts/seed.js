// Run: node scripts/seed.js
// Creates the first admin account

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  passwordHash: String,
  role: String,
  classroomId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('MONGODB_URI not set in .env.local'); process.exit(1) }

  await mongoose.connect(uri)
  const User = mongoose.models.User || mongoose.model('User', UserSchema)

  const email = process.argv[2] || 'admin@tagtech.in'
  const password = process.argv[3] || 'changeme123'
  const name = process.argv[4] || 'Admin'

  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`User ${email} already exists. Skipping.`)
    await mongoose.disconnect()
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await User.create({ name, email, passwordHash, role: 'admin' })
  console.log(`\n✅ Admin created`)
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`\nChange the password after first login.\n`)
  await mongoose.disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
