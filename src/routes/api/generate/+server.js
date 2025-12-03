import { json } from '@sveltejs/kit';
import { buildImagenPrompt } from '$lib/utils/promptBuilder';
import { env } from '$env/dynamic/private';
import { sendMail } from '$lib/utils/mailer';
import sharp from 'sharp';
import { z } from 'zod';
import Replicate from 'replicate';

const generateSchema = z.object({
  story_text: z.string().min(120, "Hikaye en az 120 karakter olmalıdır, kısa bir paragraf yeterli").max(5000, "Hikaye çok uzun"),
  theme: z.enum(['romantic', 'vintage', 'modern', 'minimalist']).optional(),
  locations: z.string().optional(),
  start_date: z.string().optional(),
  aspect_ratio: z.enum(['16:9', '9:16', '1:1']).optional(),
  qa_answers: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1)
    })
  ).max(12).optional(),
  coupon_code: z.string().max(100).optional()
});

async function getImageProvider(supabase) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('image_provider')
    .eq('id', 'main')
    .single();

  if (error || !data) {
    console.warn('Could not fetch image provider from settings, defaulting to openai');
    return 'openai';
  }

  return data.image_provider || 'openai';
}

async function generateImageWithOpenAI(prompt) {
  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY env not set');
  }

  const url = 'https://api.openai.com/v1/images/generations';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API Error:', errorText);
    throw new Error(`OpenAI API Error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;

  if (b64) {
    return { data: Buffer.from(b64, 'base64'), type: 'image/png' };
  }

  const urlResult = data.data?.[0]?.url;
  if (!urlResult) {
    throw new Error('No image data received from OpenAI API');
  }

  // Fallback: download the image from the returned URL
  const imgRes = await fetch(urlResult);
  if (!imgRes.ok) {
    const txt = await imgRes.text();
    throw new Error(`Failed to fetch image from OpenAI URL: ${imgRes.status} ${txt}`);
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  return { data: buffer, type: 'image/png' };
}

async function generateImageWithReplicate(prompt) {
  const REPLICATE_API_TOKEN = env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN env not set');
  }

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN
  });

  try {
    // Using Google's nano-banana model (Gemini 2.5 image editing model)
    // image_input is optional - we can generate from prompt only
    const output = await replicate.run('google/nano-banana', {
      input: {
        prompt: prompt,
        image_input: [] // Empty array for text-to-image generation
      }
    });

    // Replicate output can be a URL string or a File object
    let imageUrl;
    if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output.url === 'function') {
      // If it's a File object with url() method
      imageUrl = output.url();
    } else if (Array.isArray(output) && output.length > 0) {
      // If it's an array, take the first element
      imageUrl = typeof output[0] === 'string' ? output[0] : output[0]?.url?.() || output[0];
    } else if (output && output.url) {
      imageUrl = output.url;
    } else {
      throw new Error('Unexpected output format from Replicate API');
    }
    
    if (!imageUrl) {
      throw new Error('No image URL received from Replicate API');
    }

    // Download the image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      const txt = await imgRes.text();
      throw new Error(`Failed to fetch image from Replicate URL: ${imgRes.status} ${txt}`);
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    // Determine content type from response or default to png
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    return { data: buffer, type: contentType };
  } catch (error) {
    console.error('Replicate API Error:', error);
    throw new Error(`Replicate API Error: ${error.message}`);
  }
}

async function generateImage(prompt, provider, supabase) {
  // If provider not provided, fetch from database
  if (!provider) {
    provider = await getImageProvider(supabase);
  }

  console.log(`Generating image with provider: ${provider}`);

  if (provider === 'replicate') {
    return await generateImageWithReplicate(prompt);
  } else {
    return await generateImageWithOpenAI(prompt);
  }
}

async function uploadToStorage(supabase, userId, imageData, contentType, fileName) {
  const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData);
  const ext = contentType?.split('/')?.[1] || 'png';
  const name = fileName || `${userId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('maps')
    .upload(name, buffer, {
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

  // Free usage limit: max 3 unpaid maps per user
  const FREE_MAP_LIMIT = 3;

  try {
    const body = await request.json();
    
    // Validate input with Zod
    const result = generateSchema.safeParse(body);
    if (!result.success) {
      return json({ error: result.error.errors[0].message }, { status: 400 });
    }
    
    const { story_text, theme, locations, start_date, aspect_ratio, qa_answers, coupon_code } = result.data;

    // Unpaid usage limit
    const { count: unpaidCount, error: countError } = await locals.supabase
      .from('maps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .neq('payment_status', 'completed');

    if (countError) {
      console.error('Count Error:', countError);
      return json({ error: 'Failed to validate usage' }, { status: 500 });
    }

    if ((unpaidCount || 0) >= FREE_MAP_LIMIT) {
      return json({ error: 'Ücretsiz harita hakkınızı kullandınız. Devam etmek için sipariş verin.' }, { status: 403 });
    }

    // Coupon validation (optional)
    let coupon = null;
    if (coupon_code) {
      const code = coupon_code.trim();
      const { data: couponRow, error: couponError } = await locals.supabase
        .from('coupons')
        .select('code, discount_percent, max_uses, active, expires_at')
        .eq('code', code)
        .maybeSingle();

      if (couponError) {
        console.error('Coupon fetch error:', couponError);
        return json({ error: 'Kupon doğrulanamadı' }, { status: 400 });
      }

      if (!couponRow || !couponRow.active) {
        return json({ error: 'Geçersiz kupon' }, { status: 400 });
      }

      if (couponRow.expires_at && new Date(couponRow.expires_at) < new Date()) {
        return json({ error: 'Kupon süresi dolmuş' }, { status: 400 });
      }

      if (couponRow.max_uses) {
        const { count: usedCount, error: usedError } = await locals.supabase
          .from('maps')
          .select('id', { count: 'exact', head: true })
          .eq('coupon_code', code);

        if (usedError) {
          console.error('Coupon usage count error:', usedError);
          return json({ error: 'Kupon doğrulanamadı' }, { status: 400 });
        }

        if ((usedCount || 0) >= couponRow.max_uses) {
          return json({ error: 'Kupon kullanım sınırına ulaştı' }, { status: 400 });
        }
      }

      coupon = couponRow;
    }

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
    const prompt = buildImagenPrompt({ story_text, theme, locations, start_date, aspect_ratio, qa_answers });

    // 2. Get image provider from settings
    const provider = await getImageProvider(locals.supabase);
    console.log(`Using image provider: ${provider}`);

    // 3. Generate Image (PNG via selected provider)
    const { data: imageContent, type: contentType } = await generateImage(prompt, provider, locals.supabase);

    // 4. Create variants and upload to Supabase Storage
    const timestamp = Date.now();
    const basePath = `${session.user.id}/${timestamp}`;

    const baseUrl = await uploadToStorage(
      locals.supabase,
      session.user.id,
      imageContent,
      contentType,
      `${basePath}/base.png`
    );

    // Low-res thumbnail to reduce theft risk
    const thumbBuffer = await sharp(imageContent)
      .resize({ width: 320, height: 320, fit: 'cover' })
      .png({ palette: true, quality: 50 })
      .toBuffer();

    const thumbUrl = await uploadToStorage(
      locals.supabase,
      session.user.id,
      thumbBuffer,
      'image/png',
      `${basePath}/thumbnail.png`
    );

    // HD download: standardized 1:1 aspect ratio for consistent prints
    const posterBuffer = await sharp(imageContent)
      .resize({ width: 2048, height: 2048, fit: 'cover' })
      .png()
      .toBuffer();

    const posterUrl = await uploadToStorage(
      locals.supabase,
      session.user.id,
      posterBuffer,
      'image/png',
      `${basePath}/poster.png`
    );

    const wallpaperBuffer = await sharp(imageContent)
      .resize({ width: 1080, height: 1920, fit: 'cover' })
      .png()
      .toBuffer();

    const wallpaperUrl = await uploadToStorage(
      locals.supabase,
      session.user.id,
      wallpaperBuffer,
      'image/png',
      `${basePath}/wallpaper.png`
    );

    // 5. Save to Database
    const { data, error } = await locals.supabase
      .from('maps')
      .insert({
        user_id: session.user.id,
        story_text,
        story_metadata: {
          theme,
          locations,
          start_date,
          image_provider: provider,
          coupon: coupon
            ? {
                code: coupon.code,
                discount_percent: coupon.discount_percent
              }
            : null,
          aspect_ratio,
          qa_answers,
          formats: {
            thumbnail: thumbUrl,
            base: baseUrl,
            poster: posterUrl,
            wallpaper: wallpaperUrl
          }
        },
        ai_prompt: prompt,
        thumbnail_url: thumbUrl,
        hd_image_url: posterUrl,
        coupon_code: coupon?.code || null,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('DB Error:', error);
      return json({ error: 'Failed to save map' }, { status: 500 });
    }

    // Fire-and-forget email notification
    (async () => {
      try {
        const email = session.user?.email;
        if (!email) return;
        const subject = 'Haritanız hazır';
        const baseUrl = new URL(request.url).origin;
        const link = `${baseUrl}/preview/${data.id}`;
        const text = `Haritanız oluşturuldu. Önizleme: ${link}`;
        const html = `<p>Haritanız oluşturuldu.</p><p><a href="${link}">Önizleme için tıklayın</a></p>`;
        await sendMail({ to: email, subject, text, html });
      } catch (err) {
        console.error('Email send error:', err);
      }
    })();

    return json(data);
  } catch (err) {
    console.error('Generation Error:', err);
    return json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
