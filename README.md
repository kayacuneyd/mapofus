# Map of Us

Map of Us is a platform that transforms couples' and families' relationship stories into AI-generated artistic maps using Google Imagen API.

## Tech Stack

- **Frontend:** SvelteKit + TailwindCSS
- **Backend:** SvelteKit API Routes (Node.js)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** Google Imagen API
- **Payment:** Ruul.io

## Setup Instructions

### 1. Prerequisites

- Node.js 20.x
- Supabase Account
- Google Cloud Account (for Imagen API)
- Ruul.io Account

### 2. Installation

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (keep secret!)
- `GOOGLE_API_KEY`: Google Cloud API Key with Imagen API enabled
- `RUUL_API_KEY`: Ruul.io API Key
- `RUUL_WEBHOOK_SECRET`: Secret for verifying webhooks

### 4. Database Setup

Run the SQL commands in `schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

### 5. Development

```bash
npm run dev
```

### 6. Production Build

```bash
npm run build
node build
```

## Testing Guide

1.  **Auth:** Go to `/auth/register` and create an account. Verify you are redirected to `/dashboard`.
2.  **Create Map:** Click "Yeni Harita Oluştur", fill out the story form, and submit.
3.  **Generation:** Wait for the mock generation (2 seconds). You should be redirected to `/preview/[id]`.
4.  **Payment:** In the preview, click "Satın Al". Since this is a mock, you can manually update the status in the Admin Panel.
5.  **Admin:** Go to `/admin` (ensure you have access logic enabled or use the mock). Click "Confirm Payment" for your map.
6.  **Download:** Go back to `/dashboard` or `/preview/[id]`. You should see the "İndir" button.

## Deployment

Follow the VPS deployment guide in `DETAILS_FOUR.md`.
