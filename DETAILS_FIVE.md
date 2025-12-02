IMPLEMENTATION PRIORITIES:

1. START WITH CORE USER FLOW:
   - Auth system first (users must be able to register/login)
   - Then story form
   - Then image generation
   - Then preview + payment flow
   - Finally admin panel

2. USE THESE EXACT PACKAGE VERSIONS:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@google/generative-ai": "^0.1.3",
    "sharp": "^0.33.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^2.0.0",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  }
}
```

3. ERROR HANDLING REQUIREMENTS:
   - Every API route must have try-catch
   - Return user-friendly error messages (Turkish)
   - Log detailed errors server-side
   - Show loading states for async operations
   - Handle Imagen API timeout (>30s)

4. SECURITY REQUIREMENTS:
   - Never expose service role key client-side
   - Validate all user inputs (Zod schemas)
   - Sanitize file uploads
   - Rate limit image generation (1 per user per 5 minutes)
   - CSRF protection on forms
   - RLS policies on all tables

5. PERFORMANCE REQUIREMENTS:
   - Lazy load images
   - Compress images before upload
   - Use SvelteKit's prerendering for landing page
   - Cache static assets
   - Optimize bundle size (<500KB JS)

6. CODE QUALITY:
   - Use TypeScript for type safety
   - Add JSDoc comments to utility functions
   - Follow SvelteKit conventions
   - Create reusable components
   - Keep API routes thin (business logic in lib/)

7. KNOWN CHALLENGES & SOLUTIONS:
   Challenge: Google Imagen API might take >10 seconds
   Solution: Show progress indicator, consider websocket for real-time updates

   Challenge: Ruul.io webhook might be delayed
   Solution: Admin manual confirmation as backup

   Challenge: Large HD images might slow downloads
   Solution: Use Supabase Storage CDN, consider progressive loading

8. TESTING INSTRUCTIONS:
   - Test with real Supabase project (provide credentials)
   - Use Google Imagen API key (I'll provide)
   - Mock Ruul.io webhook with curl command
   - Test on mobile viewport
   - Test with Turkish characters in story

9. DOCUMENTATION TO CREATE:
   - README.md with setup instructions
   - .env.example with all required variables
   - API endpoint documentation (comments in code)
   - Deployment guide (VPS steps)

10. FUTURE ENHANCEMENTS (NOT IN MVP):
    - Multiple map styles to choose from
    - Edit story after creation
    - Gallery of public maps
    - Social sharing
    - Bulk generation for events
    - Referral system

OUTPUT FORMAT:
Please generate:
1. Complete file structure with all files
2. Full code for each file
3. Installation instructions
4. Testing guide
5. Deployment commands

IMPORTANT: 
- Generate COMPLETE, PRODUCTION-READY code
- Do not use placeholders like "// Add logic here"
- Include all imports
- Handle all edge cases
- Add Turkish UI text where appropriate