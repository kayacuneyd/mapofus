const BASE_MAP_TEMPLATE = {
  title: "MAP OF US",
  subtitle: "Couple names or a short caption under the title",
  style: "hand-drawn black and white line art on textured paper",
  composition: "a winding road linking 6-10 key memories in loose chronological order",
  must_haves: [
    "clear lettering for title and subtitle",
    "small icons for each stop (arches, church, houses, mountains, bikes, campfire)",
    "sprinkled filler elements like trees, footprints, a kite or backpack for texture",
    "balanced white space; keep it uncluttered and print-friendly",
    "2px solid black stroke framing the entire map like a poster border"
  ],
  tone: "warm, optimistic, PG; no gore or explicit content",
  text_handling: "labels only, avoid long paragraphs on the map",
  qa_intent: "use 6-10 guided cues from the user to decide the 6-10 main stops"
};

const MAX_QA_ITEMS = 10;
const MAX_QA_TEXT = 180;

const truncate = (txt = "", limit = 160) => {
  if (!txt) return "";
  return txt.length > limit ? `${txt.slice(0, limit)}...` : txt;
};

export function buildImagenPrompt(storyData) {
  const { story_text, theme, locations, start_date, aspect_ratio, qa_answers } = storyData;

  // Single model: enforce minimalist line-art style regardless of theme selection
  const style = "simple black and white line art, clean strokes, minimal shading, understated and print-friendly";

  const trimmedStory = (story_text || "").trim();
  const shortStory = trimmedStory || "Brief relationship highlights; keep it universal, warm, and hopeful.";
  const clippedStory = shortStory.length > 1200 ? `${shortStory.slice(0, 1200)}...` : shortStory;

  const qaList = Array.isArray(qa_answers)
    ? qa_answers
        .filter((item) => item?.answer?.trim())
        .slice(0, MAX_QA_ITEMS)
        .map((item) => ({
          question: truncate(item.question?.trim(), 80),
          answer: truncate(item.answer?.trim(), MAX_QA_TEXT)
        }))
    : [];
  const qaText = qaList.length
    ? qaList.map((item) => `${item.question}: ${item.answer}`).join(" | ")
    : "";

  let prompt = `You are illustrating a custom relationship map poster. Use this base scaffold (treat as JSON spec, then render visually): ${JSON.stringify(BASE_MAP_TEMPLATE)}. `;
  prompt += `Style: ${style}. `;
  prompt += `Ensure a thin 2px black stroke frame around the map, with balanced margins inside the frame. `;

  if (locations) {
    prompt += `Priority locations or labels to weave in: ${locations}. `;
  }

  if (start_date) {
    prompt += `Mark the significant date subtly near the title or relevant stop: ${start_date}. `;
  }

  if (aspect_ratio) {
    prompt += `Target aspect ratio: ${aspect_ratio}. Compose the layout to fit this ratio naturally, without cropping key elements. `;
  }

  prompt += `User story cues (keep them even if brief, summarize where needed): ${clippedStory}. `;
  if (qaText) {
    prompt += `Guided Q&A highlights to prioritize (prefer 6-10 cues; user-facing prompts are passive voice like “oluşturduğunuz bu görseldeki kişi/lerle ilk nerede buluşturunuz”, “sizin için yakınlık derecesi”, “kişi/lerle yaptığınız ilk tatil”, “ilk tanışma noktası”): ${qaText}. `;
  }
  prompt += `Render as a cohesive hand-drawn map with a winding road, small legible labels, and balanced negative space. Avoid long text blocks; keep the tone sentimental and PG. High resolution, suitable for framing.`;

  return prompt;
}
