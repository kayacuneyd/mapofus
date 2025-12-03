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