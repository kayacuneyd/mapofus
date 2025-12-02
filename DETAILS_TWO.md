🎯 Comprehensive Prompt for Google Gemini Pro
PART 1: Project Context & Overview
You are an expert full-stack developer specializing in SvelteKit, Node.js, and modern web architectures. I need you to build a complete web application called "Map of Us" - a platform that transforms couples' and families' relationship stories into AI-generated artistic maps using Google Imagen API.

PROJECT OVERVIEW:
- Name: Map of Us
- Purpose: Convert relationship stories into beautiful, artistic map visualizations that couples can purchase and keep as memorabilia
- Tech Stack: SvelteKit + Supabase (PostgreSQL + Auth + Storage) + Google Imagen API + Ruul.io (payment)
- Hosting: Hybrid approach (Frontend: Vercel, Backend API: VPS with PM2 + Nginx)
- Target Market: Turkish and international couples/families
- Business Model: Paid product (₺299 per high-resolution download via Ruul.io)

USER FLOW:
1. User registers/logs in (Supabase Auth)
2. User fills out a story form (500-750 words about their relationship journey)
3. System generates AI prompt from the story
4. Google Imagen API creates both thumbnail (512x512, watermarked) and HD version (1024x1024)
5. User sees low-res preview with "Purchase HD Version" button
6. User clicks → redirected to Ruul.io payment link
7. After payment, Ruul.io webhook notifies our system
8. Admin manually confirms payment in admin panel
9. User's map status changes to "completed"
10. User can download HD version from dashboard

CRITICAL REQUIREMENTS:
- User authentication is mandatory (no guest access)
- Two image versions: thumbnail (free preview) + HD (paid)
- Manual payment confirmation by admin (not automated)
- Images stored in Supabase Storage
- Payment integration via Ruul.io webhook
- Responsive design (mobile + desktop)
- SEO optimized (SvelteKit SSR)

PART 2: Technical Architecture
DETAILED TECH STACK:

FRONTEND:
- Framework: SvelteKit 2.x
- Styling: TailwindCSS 3.x
- UI Components: Shadcn-svelte (optional) or custom components
- Form Validation: Zod
- State Management: Svelte stores
- HTTP Client: Built-in fetch
- Icons: Lucide Svelte

BACKEND (SvelteKit API Routes):
- Location: src/routes/api/
- Endpoints needed:
  * POST /api/generate - Story to image generation
  * POST /api/payment-webhook - Ruul.io webhook receiver
  * GET /api/download/[id] - Serve HD image (authenticated)
  * GET /api/admin/maps - List all maps (admin only)
  * PATCH /api/admin/maps/[id] - Update payment status

AUTHENTICATION:
- Provider: Supabase Auth
- Methods: Email/Password (can add Google OAuth later)
- Session management: Supabase client-side SDK
- Protected routes: Dashboard, Admin, Download

DATABASE (Supabase PostgreSQL):
Schema:
```sql
-- Users table (managed by Supabase Auth, extend if needed)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maps table
CREATE TABLE public.maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_text TEXT NOT NULL,
  story_metadata JSONB, -- Optional: store theme, date range, locations
  ai_prompt TEXT NOT NULL, -- The prompt sent to Imagen
  thumbnail_url TEXT NOT NULL, -- Low-res preview URL (Supabase Storage)
  hd_image_url TEXT NOT NULL, -- HD version URL (Supabase Storage)
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  ruul_payment_id VARCHAR(255), -- Ruul.io transaction ID
  ruul_payment_data JSONB, -- Store full webhook payload
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maps_user_id ON public.maps(user_id);
CREATE INDEX idx_maps_payment_status ON public.maps(payment_status);
CREATE INDEX idx_maps_created_at ON public.maps(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own maps
CREATE POLICY "Users can view own maps"
  ON public.maps FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own maps
CREATE POLICY "Users can create own maps"
  ON public.maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only admins can update payment status
CREATE POLICY "Admins can update maps"
  ON public.maps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND email = 'admin@mapofus.com'
    )
  );
```

STORAGE (Supabase Storage):
Buckets:
- `map-thumbnails` (public read)
- `map-hd` (private, authenticated access only)

FILE STRUCTURE:
mapofus/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/ (reusable UI components)
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   └── Modal.svelte
│   │   │   ├── StoryForm.svelte
│   │   │   ├── MapPreview.svelte
│   │   │   ├── PaymentButton.svelte
│   │   │   └── AdminMapTable.svelte
│   │   ├── stores/
│   │   │   ├── auth.js (user session store)
│   │   │   └── toast.js (notification store)
│   │   ├── utils/
│   │   │   ├── supabase.js (Supabase client init)
│   │   │   ├── promptBuilder.js (story → AI prompt logic)
│   │   │   └── imageProcessor.js (add watermark to thumbnail)
│   │   └── types/
│   │       └── index.ts (TypeScript types)
│   ├── routes/
│   │   ├── +layout.svelte (global layout, navbar, footer)
│   │   ├── +layout.js (load user session globally)
│   │   ├── +page.svelte (landing page)
│   │   ├── auth/
│   │   │   ├── register/+page.svelte
│   │   │   ├── login/+page.svelte
│   │   │   └── callback/+page.svelte (OAuth callback if needed)
│   │   ├── dashboard/
│   │   │   ├── +page.svelte (user's maps list)
│   │   │   └── +page.server.js (server-side data loading)
│   │   ├── create/
│   │   │   ├── +page.svelte (story form)
│   │   │   └── +page.server.js (form actions)
│   │   ├── preview/
│   │   │   └── [id]/
│   │   │       ├── +page.svelte (show thumbnail + payment button)
│   │   │       └── +page.server.js (load map data)
│   │   ├── admin/
│   │   │   ├── +layout.svelte (admin layout with sidebar)
│   │   │   ├── +layout.server.js (check admin role)
│   │   │   ├── +page.svelte (admin dashboard)
│   │   │   └── maps/+page.svelte (map management table)
│   │   └── api/
│   │       ├── generate/
│   │       │   └── +server.js (POST: story → Imagen → Supabase Storage)
│   │       ├── payment-webhook/
│   │       │   └── +server.js (POST: Ruul.io webhook handler)
│   │       ├── download/
│   │       │   └── [id]/+server.js (GET: serve HD image if paid)
│   │       └── admin/
│   │           └── maps/
│   │               ├── +server.js (GET: list all maps)
│   │               └── [id]/+server.js (PATCH: update payment status)
│   ├── app.html (HTML template)
│   └── app.css (global styles, Tailwind imports)
├── static/ (favicon, images, etc.)
├── .env.example
├── .env (gitignored)
├── svelte.config.js
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md

ENVIRONMENT VARIABLES (.env):
```bash
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Imagen API
GOOGLE_IMAGEN_API_KEY=your-imagen-api-key
GOOGLE_PROJECT_ID=your-gcp-project-id

# Ruul.io
RUUL_WEBHOOK_SECRET=your-webhook-secret
RUUL_PAYMENT_LINK=https://ruul.io/space/yourspace/product-id

# Admin
ADMIN_EMAIL=admin@mapofus.com

# App
PUBLIC_APP_URL=https://mapofus.com
```