COMPONENT SPECIFICATIONS:

1. LANDING PAGE (/)
Requirements:
- Hero section with compelling headline: "Dönüştürün İlişki Hikayenizi Sanat Eserine"
- 3-4 example maps (placeholder images)
- "Hemen Başla" CTA button → redirects to /auth/register
- Features section: "Nasıl Çalışır?" (4 steps with icons)
- Pricing: "Sadece ₺299"
- FAQ section (accordion)
- Footer with links

Design:
- Modern, clean, romantic aesthetic
- Soft color palette (pastels + warm tones)
- Mobile-first responsive

2. AUTHENTICATION (/auth/register, /auth/login)
Requirements:
- Email + Password fields
- Supabase Auth integration
- Form validation (email format, password min 8 chars)
- Error handling (duplicate email, wrong password)
- "Şifremi Unuttum" link (Supabase reset flow)
- After login → redirect to /dashboard

Design:
- Centered card layout
- Social proof testimonial on the side

3. DASHBOARD (/dashboard)
Requirements:
- Show all user's maps in a grid
- Each card shows:
  * Thumbnail preview
  * Created date
  * Payment status badge (Beklemede/Tamamlandı)
  * "İndir" button (only if payment_status = 'completed')
  * "Ödeme Yap" button (if status = 'pending')
- "Yeni Harita Oluştur" button → /create
- Empty state if no maps yet

Server-side data loading:
```js
// dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.getSession();
  if (!session) throw redirect(303, '/auth/login');

  const { data: maps } = await locals.supabase
    .from('maps')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return { maps };
}
```

4. STORY FORM (/create)
Requirements:
- Rich text area for story (500-750 words, character counter)
- Optional fields:
  * Relationship start date (date picker)
  * Key locations (comma-separated text input)
  * Theme preference (dropdown: Romantic, Vintage, Modern, Minimalist)
- Submit button → POST to /api/generate
- Loading state with progress indicator
- After success → redirect to /preview/[new-map-id]

Validation:
- Story min 500 chars, max 2000 chars
- Required field validation

5. AI PROMPT BUILDER (lib/utils/promptBuilder.js)
Purpose: Transform user story into a detailed prompt for Google Imagen

Logic:
```javascript
export function buildImagenPrompt(storyData) {
  const { story_text, theme, locations, start_date } = storyData;
  
  // Extract key elements from story using simple NLP
  const keyPlaces = extractPlaces(story_text, locations);
  const emotions = extractEmotions(story_text);
  const timeSpan = calculateTimeSpan(start_date);
  
  // Build structured prompt
  let prompt = `Create an artistic illustrated map showing a relationship journey. `;
  
  // Add theme-specific style directives
  const styleMap = {
    romantic: "watercolor style with soft pink and gold tones, whimsical hand-drawn elements",
    vintage: "aged paper texture, sepia tones, antique map aesthetic with decorative borders",
    modern: "clean minimalist design, geometric shapes, contemporary color palette",
    minimalist: "simple line art, limited color palette, elegant and understated"
  };
  
  prompt += `Style: ${styleMap[theme] || styleMap.romantic}. `;
  
  // Add location markers
  if (keyPlaces.length > 0) {
    prompt += `The map should feature these key locations: ${keyPlaces.join(', ')}. `;
  }
  
  // Add emotional context
  prompt += `Convey emotions of ${emotions.join(', ')}. `;
  
  // Add timeline element
  prompt += `Include visual timeline markers spanning ${timeSpan}. `;
  
  // Technical specs
  prompt += `High detail, suitable for printing, no text labels, decorative border.`;
  
  return prompt;
}

function extractPlaces(text, providedLocations) {
  // Simple keyword extraction for cities/countries
  // You can enhance this with NER (Named Entity Recognition) later
  const places = providedLocations ? providedLocations.split(',').map(p => p.trim()) : [];
  const commonPlaces = ['Istanbul', 'Ankara', 'Paris', 'Rome', 'New York', 'London'];
  commonPlaces.forEach(place => {
    if (text.includes(place) && !places.includes(place)) {
      places.push(place);
    }
  });
  return places.slice(0, 5); // Max 5 locations
}

function extractEmotions(text) {
  const emotionKeywords = {
    joy: ['mutlu', 'happy', 'sevinç', 'joy'],
    love: ['aşk', 'love', 'sevgi'],
    adventure: ['macera', 'adventure', 'keşif'],
    nostalgia: ['nostalji', 'anı', 'memory']
  };
  
  const detected = [];
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw))) {
      detected.push(emotion);
    }
  }
  return detected.length > 0 ? detected : ['love', 'joy'];
}

function calculateTimeSpan(startDate) {
  if (!startDate) return "several years";
  const start = new Date(startDate);
  const now = new Date();
  const years = Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
  return years > 0 ? `${years} years` : "recent months";
}
```

6. IMAGEN API INTEGRATION (/api/generate/+server.js)
Requirements:
- Receive story data from form
- Build AI prompt using promptBuilder
- Call Google Imagen API twice:
  * Thumbnail: 512x512
  * HD: 1024x1024
- Add watermark to thumbnail (text overlay: "Map of Us - Preview")
- Upload both images to Supabase Storage
- Insert record into `maps` table
- Return map ID

Implementation:
```javascript
import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

export async function POST({ request, locals }) {
  const session = await locals.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { story_text, theme, locations, start_date } = await request.json();

  // Build prompt
  const prompt = buildImagenPrompt({ story_text, theme, locations, start_date });

  try {
    // Call Google Imagen API
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_IMAGEN_API_KEY);
    const model = genAI.getGenerativeModel({ model: "imagen-2" });

    // Generate HD image
    const hdResult = await model.generateImage({
      prompt,
      numberOfImages: 1,
      aspectRatio: "1:1",
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      ],
    });

    const hdImageBuffer = Buffer.from(hdResult.images[0].imageData, 'base64');

    // Create thumbnail with watermark
    const thumbnailBuffer = await sharp(hdImageBuffer)
      .resize(512, 512)
      .composite([{
        input: Buffer.from(`
          <svg width="512" height="512">
            <text x="256" y="256" font-size="24" fill="rgba(255,255,255,0.7)" 
                  text-anchor="middle" font-family="Arial">
              Map of Us - Preview
            </text>
          </svg>
        `),
        gravity: 'center'
      }])
      .toBuffer();

    // Upload to Supabase Storage
    const thumbnailPath = `thumbnails/${session.user.id}/${Date.now()}_thumb.png`;
    const hdPath = `hd/${session.user.id}/${Date.now()}_hd.png`;

    const { data: thumbData, error: thumbError } = await locals.supabase.storage
      .from('map-thumbnails')
      .upload(thumbnailPath, thumbnailBuffer, { contentType: 'image/png' });

    const { data: hdData, error: hdError } = await locals.supabase.storage
      .from('map-hd')
      .upload(hdPath, hdImageBuffer, { contentType: 'image/png' });

    if (thumbError || hdError) throw new Error('Storage upload failed');

    // Get public URLs
    const { data: thumbUrl } = locals.supabase.storage
      .from('map-thumbnails')
      .getPublicUrl(thumbnailPath);

    const { data: hdUrl } = locals.supabase.storage
      .from('map-hd')
      .getPublicUrl(hdPath);

    // Insert into database
    const { data: map, error: dbError } = await locals.supabase
      .from('maps')
      .insert({
        user_id: session.user.id,
        story_text,
        story_metadata: { theme, locations, start_date },
        ai_prompt: prompt,
        thumbnail_url: thumbUrl.publicUrl,
        hd_image_url: hdUrl.publicUrl,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return json({ success: true, mapId: map.id });

  } catch (error) {
    console.error('Generation error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
```

7. PREVIEW PAGE (/preview/[id])
Requirements:
- Load map data from database
- Show thumbnail image
- Payment status indicator
- If pending:
  * "Yüksek Kalitede İndir - ₺299" button
  * Click → redirect to Ruul.io payment link with map_id parameter
- If completed:
  * "HD Sürümü İndir" button → /api/download/[id]
- "Hikayeni Düzenle" button (future feature)

Server-side:
```javascript
// preview/[id]/+page.server.js
export async function load({ params, locals }) {
  const { data: map } = await locals.supabase
    .from('maps')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!map) throw error(404, 'Map not found');

  return { map };
}
```

8. RUUL.IO WEBHOOK (/api/payment-webhook/+server.js)
Requirements:
- Verify webhook signature (Ruul.io provides HMAC verification)
- Parse payload to extract:
  * Transaction ID
  * Amount
  * Status (completed/failed)
  * Custom metadata (map_id)
- Update map record:
  * Set ruul_payment_id
  * Store full payload in ruul_payment_data
  * Keep payment_status as 'pending' (admin will confirm manually)
- Return 200 OK to acknowledge webhook

Implementation:
```javascript
import { json } from '@sveltejs/kit';
import crypto from 'crypto';

export async function POST({ request, locals }) {
  const payload = await request.text();
  const signature = request.headers.get('x-ruul-signature');

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RUUL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(payload);

  if (data.event === 'payment.completed') {
    const { transaction_id, metadata } = data;
    const mapId = metadata.map_id;

    // Update map with payment info (but keep status as pending for manual review)
    await locals.supabase
      .from('maps')
      .update({
        ruul_payment_id: transaction_id,
        ruul_payment_data: data,
        updated_at: new Date().toISOString()
      })
      .eq('id', mapId);
  }

  return json({ received: true });
}
```

9. ADMIN PANEL (/admin/maps)
Requirements:
- Check if user email === ADMIN_EMAIL (in +layout.server.js)
- Table showing all maps with columns:
  * User email
  * Created date
  * Thumbnail preview
  * Payment status
  * Ruul transaction ID
  * Action: "Onayla" button (if pending)
- Click "Onayla" → PATCH /api/admin/maps/[id] → payment_status = 'completed'
- Real-time refresh after action

Security:
```javascript
// admin/+layout.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.getSession();
  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    throw redirect(303, '/dashboard');
  }
  return {};
}
```

10. DOWNLOAD ENDPOINT (/api/download/[id]/+server.js)
Requirements:
- Verify user is authenticated
- Check if map belongs to user OR user is admin
- Check if payment_status = 'completed'
- If valid: stream HD image file
- If not: return 403 Forbidden

Implementation:
```javascript
import { error } from '@sveltejs/kit';

export async function GET({ params, locals }) {
  const session = await locals.getSession();
  if (!session) throw error(401, 'Unauthorized');

  const { data: map } = await locals.supabase
    .from('maps')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!map) throw error(404, 'Not found');

  // Check ownership and payment
  const isOwner = map.user_id === session.user.id;
  const isAdmin = session.user.email === process.env.ADMIN_EMAIL;
  const isPaid = map.payment_status === 'completed';

  if (!isOwner && !isAdmin) throw error(403, 'Forbidden');
  if (!isPaid) throw error(403, 'Payment not completed');

  // Download from Supabase Storage
  const { data: blob, error: downloadError } = await locals.supabase.storage
    .from('map-hd')
    .download(map.hd_image_url.split('/map-hd/')[1]);

  if (downloadError) throw error(500, 'Download failed');

  return new Response(blob, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="mapofus_${params.id}.png"`
    }
  });
}
```

TESTING CHECKLIST:
□ User registration works
□ Login redirects to dashboard
□ Story form validates input
□ Image generation completes in <30 seconds
□ Thumbnail has watermark
□ Payment button links to Ruul.io with correct parameters
□ Webhook updates database correctly
□ Admin can see all maps
□ Admin can approve payments
□ Download only works after payment approval
□ Download serves correct HD file
□ RLS policies prevent unauthorized access
□ Mobile responsive on all pages
□ Error handling shows user-friendly messages