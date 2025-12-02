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

// Mock Google Imagen API for now since we don't have the SDK installed or configured
// In a real implementation, you would import the Google AI SDK
async function generateImage(prompt) {
  // This is a placeholder. In production, use the actual Google Imagen API.
  // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  // const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" }); ...
  
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    thumbnail: "https://via.placeholder.com/512x512?text=Map+Preview",
    hd: "https://via.placeholder.com/1024x1024?text=HD+Map"
  };
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

    // Rate Limiting: Check last map creation time
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
      
      if (diffMinutes < 5) {
        return json({ error: 'Lütfen yeni bir harita oluşturmadan önce 5 dakika bekleyin.' }, { status: 429 });
      }
    }

    // 1. Build Prompt
    const prompt = buildImagenPrompt({ story_text, theme, locations, start_date });

    // 2. Generate Image (Mocked)
    const images = await generateImage(prompt);

    // 3. Save to Database
    const { data, error } = await locals.supabase
      .from('maps')
      .insert({
        user_id: session.user.id,
        story_text,
        story_metadata: { theme, locations, start_date },
        ai_prompt: prompt,
        thumbnail_url: images.thumbnail,
        hd_image_url: images.hd,
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
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
