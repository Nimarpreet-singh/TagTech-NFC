import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables')

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null
  var _mongoosePromise: Promise<typeof mongoose> | null
}

let cached = global._mongooseConn
let cachedPromise = global._mongoosePromise

export async function connectDB() {
  if (cached) return cached
  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }
  cached = await cachedPromise
  global._mongooseConn = cached
  global._mongoosePromise = cachedPromise
  return cached
}
