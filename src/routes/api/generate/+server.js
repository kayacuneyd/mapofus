import { json } from '@sveltejs/kit';
import { buildImagenPrompt } from '$lib/utils/promptBuilder';
import { GOOGLE_API_KEY } from '$env/static/private';
import { z } from 'zod';

const generateSchema = z.object({
  story_text: z.string().min(500, "Hikaye en az 500 karakter olmalıdır").max(5000, "Hikaye çok uzun"),
  theme: z.enum(['romantic', 'vintage', 'modern', 'minimalist']).optional(),
  locations: z.string().optional(),
  start_date: z.string().optional()
});

// Fallback to Gemini for SVG generation since Imagen requires Vertex AI setup
async function generateImage(prompt) {
  // Using gemini-pro as it is the most stable and widely available model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`;
  
  const svgPrompt = `${prompt} 
  
  CRITICAL INSTRUCTION: You are an AI map generator. Create a highly detailed, artistic SVG map based on the story.
  - Output ONLY the raw SVG code. 
  - Do NOT use markdown code blocks (no \`\`\`xml or \`\`\`svg).
  - Do NOT add any introductory or concluding text.
  - The SVG must be 1024x1024 viewbox.
  - Use beautiful colors and gradients matching the theme.
  - Include stylized text labels for key locations mentioned.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: svgPrompt }] }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Google API Error:', errorData);
    throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No data received from Gemini API');
  }

  // Cleanup markdown if present
  text = text.replace(/```svg/g, '').replace(/```xml/g, '').replace(/```/g, '').trim();
  
  return { data: text, type: 'image/svg+xml' };
}

async function uploadToStorage(supabase, userId, imageData, contentType) {
  const buffer = Buffer.from(imageData);
  const ext = 'svg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('maps')
    .upload(fileName, buffer, {
      contentType: contentType,
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('maps')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function POST({ request, locals }) {
  const session = await locals.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate input with Zod
    const result = generateSchema.safeParse(body);
    if (!result.success) {
      return json({ error: result.error.errors[0].message }, { status: 400 });
    }
    
    const { story_text, theme, locations, start_date } = result.data;

    // Rate Limiting
    const { data: lastMap } = await locals.supabase
      .from('maps')
      .select('created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMap) {
      const lastTime = new Date(lastMap.created_at).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastTime) / 1000 / 60;
      
      if (diffMinutes < 0.5) { // Reduced for testing
        return json({ error: 'Lütfen biraz bekleyin.' }, { status: 429 });
      }
    }

    // 1. Build Prompt
    const prompt = buildImagenPrompt({ story_text, theme, locations, start_date });

    // 2. Generate Image (SVG via Gemini)
    const { data: imageContent, type: contentType } = await generateImage(prompt);

    // 3. Upload to Supabase Storage
    const imageUrl = await uploadToStorage(locals.supabase, session.user.id, imageContent, contentType);

    // 4. Save to Database
    const { data, error } = await locals.supabase
      .from('maps')
      .insert({
        user_id: session.user.id,
        story_text,
        story_metadata: { theme, locations, start_date },
        ai_prompt: prompt,
        thumbnail_url: imageUrl,
        hd_image_url: imageUrl,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('DB Error:', error);
      return json({ error: 'Failed to save map' }, { status: 500 });
    }

    return json(data);
  } catch (err) {
    console.error('Generation Error:', err);
    return json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
