# TagTech

NFC-powered link delivery for classrooms. Teachers share a URL once; all NFC tags in the room redirect to it instantly. No re-programming tags ever.

## How it works

1. Each classroom has two permanent NFC URLs — one for student benches, one for the teacher bench
2. These URLs are written to physical NFC tags **once** and never change
3. When a teacher activates a link (PPT, PDF, Google Slides), all student taps redirect to it
4. After the time window expires, tapping shows "no active link"

---

## Quick start

### 1. Clone & install

```bash
git clone <your-repo>
cd tagtech
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tagtech?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_at_least_32_characters
NEXT_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
```

### 3. Seed the first admin account

```bash
node scripts/seed.js admin@yourschool.edu yourpassword "Admin Name"
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — sign in with your admin credentials.

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Option B — GitHub

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel domain, e.g. `https://tagtech.vercel.app`)
4. Deploy

---

## First-time setup flow

1. Sign in as admin → `/admin`
2. Create a classroom — fills in room name, teacher email, teacher password
3. Copy the **Student URL** (e.g. `https://tagtech.vercel.app/api/tap/s-a1b2c3d4`)
4. Write that URL to all NFC tags on student benches using any NFC writer app (e.g. NFC Tools on Android/iOS)
5. Teacher signs in at `/login` with their email + password
6. Teacher pastes a link, sets duration, clicks Activate
7. Students tap their tags → instant redirect

---

## Roles

| Role    | Can do                                              |
|---------|-----------------------------------------------------|
| Admin   | Create/delete classrooms, manage teacher accounts   |
| Teacher | Activate/reset links, set duration, view tap count  |
| Student | No login — just tap the NFC tag                    |

---

## NFC tag setup

Use any NFC writer app to write a **URL record** to each tag:

- **Student bench tags** → `https://yourdomain.com/api/tap/s-xxxxxxxx`
- **Teacher bench tag** → `https://yourdomain.com/api/tap/t-xxxxxxxx`

Copy these URLs from the admin dashboard. Each classroom has its own unique slugs.

---

## MongoDB Atlas setup (if new)

1. Go to cloud.mongodb.com → Create free cluster
2. Database Access → Add user with read/write permissions
3. Network Access → Allow all IPs (0.0.0.0/0) for Vercel
4. Connect → Drivers → copy the connection string
5. Replace `<password>` in the URI with your DB user password

---

## Project structure

```
src/
  app/
    api/
      auth/login/     → POST login, returns JWT cookie
      auth/logout/    → POST clears cookie
      auth/me/        → GET current user
      classrooms/     → GET list, POST create, DELETE by id
      sessions/       → GET active session, POST activate, DELETE reset
      tap/[slug]/     → GET → NFC redirect handler (core logic)
    admin/            → Admin dashboard
    teacher/          → Teacher dashboard
    login/            → Login page
    tap/
      inactive/       → "No active link" page
      not-found/      → Unknown tag page
  lib/
    db.ts             → MongoDB connection
    jwt.ts            → Sign/verify JWT
    auth.ts           → Extract user from request
  models/
    User.ts           → name, email, passwordHash, role, classroomId
    Classroom.ts      → name, studentSlug, teacherSlug, teacherEmail
    Session.ts        → classroomId, url, expiresAt, tapCount
  middleware.ts       → Route protection + role guards
scripts/
  seed.js             → Create first admin account
```
