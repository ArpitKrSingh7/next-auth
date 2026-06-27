# Brainly — Sticky Notes App

A simple, fast, and shareable sticky-notes app built with Next.js 15, NextAuth, Prisma, and Tailwind CSS. Supports Google + email login, priority tagging, color-coded notes, public sharing, dark mode, and AI-powered briefs via Groq.

---

## Features

- **Authentication**
  - Google OAuth login
  - Email/password login with bcrypt-hashed passwords
  - Separate accounts for Google and credentials (same email = two different users)
- **Notes**
  - Create, edit, delete sticky notes
  - Set priority: `LOW`, `MEDIUM`, `HIGH`
  - Pick background colors
  - Notes are private by default
- **Sharing**
  - Make any note public with one click
  - Public link: `/note/{id}`
  - Private notes return 404 when shared
- **AI Brief**
  - "Generate Brief" button summarizes all your notes
  - Powered by Groq (`llama-3.1-8b-instant`)
- **Dark Mode**
  - System-aware default
  - Manual toggle, persisted to `localStorage`
- **Responsive UI**
  - Clean card layout
  - Works on desktop and mobile

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth v4 |
| ORM | Prisma 7 |
| Database | PostgreSQL (Prisma Postgres in this repo) |
| Styling | Tailwind CSS v4 |
| AI | Groq SDK |
| Icons | Inline SVG |

---

## Project Structure

```
app/
  api/
    auth/[...nextauth]/route.ts   # NextAuth API handler
    auth/signup/route.ts          # Credentials signup endpoint
    notes/route.ts                # List / create notes
    notes/[id]/route.ts           # Update / delete a note
    summarize/route.ts            # AI summary via Groq
  components/
    Providers.tsx                 # SessionProvider wrapper
    ThemeProvider.tsx             # Dark mode context
    ThemeToggle.tsx               # Dark mode toggle button
  lib/
    auth.ts                       # NextAuth options
  note/[id]/page.tsx              # Public shared note page
  page.tsx                        # Landing page
  signin/page.tsx                 # Sign-in page
  signup/page.tsx                 # Sign-up page
  user/page.tsx                   # Notes dashboard
  layout.tsx                      # Root layout with ThemeProvider
lib/
  prisma.ts                       # Prisma client singleton
prisma/
  schema.prisma                   # Database schema
public/
  ...                             # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- PostgreSQL database (or Prisma Postgres account)
- Google OAuth credentials
- Groq API key

### 1. Clone and install

```bash
git clone <repo-url>
cd next-auth
pnpm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/brainly_db"

# NextAuth
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Groq API (from https://console.groq.com/keys)
GROQ_API_KEY="gsk_your_groq_key"
```

#### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

#### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Application type: **Web application**
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-production-domain.com/api/auth/callback/google`
6. Copy **Client ID** and **Client Secret** to `.env.local`

#### Groq API key

1. Sign up at https://console.groq.com/
2. Create an API key
3. Copy it to `GROQ_API_KEY`

### 3. Set up the database

```bash
pnpm db:push
```

This creates the tables based on `prisma/schema.prisma`.

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Routes

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth endpoints | — |
| POST | `/api/auth/signup` | Create credentials account | — |
| GET | `/api/notes` | List current user's notes | Required |
| POST | `/api/notes` | Create a note | Required |
| PATCH | `/api/notes/[id]` | Update a note (title, content, priority, color, isPublic) | Required |
| DELETE | `/api/notes/[id]` | Delete a note | Required |
| POST | `/api/summarize` | Generate AI brief of all notes | Required |

---

## Database Schema

```prisma
model User {
  id               String    @id @default(cuid())
  email            String?   @unique   // Google users
  googleId         String?   @unique
  credentialsEmail String?   @unique   // Credentials users
  username         String?   @unique
  name             String?
  image            String?
  passwordHash     String?             // Credentials only
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @default(now()) @updatedAt
  notes            Note[]
}

model Note {
  id        String   @id @default(cuid())
  title     String?
  content   String   @db.Text
  priority  Priority @default(MEDIUM)
  color     String?
  isPublic  Boolean  @default(false)
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime  @default(now()) @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

**Account separation:** Google users store email in `email`; credentials users store email in `credentialsEmail`. This lets the same email address exist as two completely separate accounts.

---

## Authentication Flow

### Google sign-in

1. User clicks "Continue with Google"
2. NextAuth handles OAuth with Google
3. In the JWT callback, the app looks up or creates a `User` row with `googleId`
4. The internal `User.id` is stored in the JWT
5. User is redirected to `/user`

### Credentials sign-up / sign-in

1. User fills the sign-up form
2. Frontend POSTs to `/api/auth/signup`
3. Backend hashes password with bcrypt and creates `User` with `credentialsEmail`
4. After signup, frontend auto-signs in via `signIn("credentials", ...)`
5. For sign-in, NextAuth's `authorize` callback verifies email + password hash

---

## Dark Mode

- Default theme follows the system preference.
- Toggle button appears in the navbar on landing, sign-in, sign-up, and dashboard pages.
- Preference is saved to `localStorage`.
- A small inline script in `app/layout.tsx` sets the theme class before React hydrates to prevent flashes.

---

## Sharing Notes

1. On `/user`, each note card has a **Make public** button.
2. Clicking it sets `isPublic = true` and copies the public link to your clipboard.
3. The public link format is `/note/{noteId}`.
4. Anyone with the link can view the note.
5. Clicking **Share** again toggles `isPublic` back to false, making the link return 404.

---

## AI Brief

1. Click **Generate Brief** on `/user`.
2. All notes (title, content, priority) are sent to `/api/summarize`.
3. The backend calls Groq's `llama-3.1-8b-instant` model.
4. A short summary appears in a purple card.
5. High-priority items are highlighted by the model.

---

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. For `NEXTAUTH_URL`, use your production domain
5. Add the production Google OAuth redirect URI:
   - `https://your-domain.com/api/auth/callback/google`
6. Deploy

### Important for Vercel

- Make sure `DATABASE_URL` points to a hosted PostgreSQL database (e.g., Neon, Supabase, Prisma Postgres).
- The Prisma client is generated at build time by `prisma generate` (already included in build).

---

## Available Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm db:push    # Push schema changes to database
pnpm db:generate # Generate Prisma client
pnpm db:migrate  # Create and apply migrations
```

---

## Troubleshooting

### Google sign-in fails

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure `NEXTAUTH_URL` matches your actual URL
- Add the exact redirect URI to Google Cloud Console

### "User not found" when creating notes

- Sign out and sign in again to refresh the JWT
- This can happen after database resets or schema changes

### AI summary fails

- Check `GROQ_API_KEY` is set
- Groq free tier has rate limits; wait a moment and retry

### Database column errors

- Run `pnpm db:push` after any schema change

---

## License

MIT
