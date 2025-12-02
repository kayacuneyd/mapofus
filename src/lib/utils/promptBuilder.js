export function buildImagenPrompt(storyData) {
  const { story_text, theme, locations, start_date } = storyData;
  
  // Extract key elements from story using simple NLP (mocked for now)
  // In a real app, you might use a lighter AI model to extract these or just use the text directly
  
  // Build structured prompt
  let prompt = `Create an artistic illustrated map showing a relationship journey. `;
  
  // Add theme-specific style directives
  const styleMap = {
    romantic: "watercolor style with soft pink and gold tones, whimsical hand-drawn elements",
    vintage: "aged paper texture, sepia tones, antique map aesthetic with decorative borders",
    modern: "clean minimalist design, geometric shapes, contemporary color palette",
    minimalist: "simple line art, limited color palette, elegant and understated"
  };

  if (theme && styleMap[theme.toLowerCase()]) {
    prompt += `Style: ${styleMap[theme.toLowerCase()]}. `;
  } else {
    prompt += `Style: ${styleMap['romantic']}. `;
  }

  if (locations) {
    prompt += `Highlight these locations: ${locations}. `;
  }

  if (start_date) {
    prompt += `Include the date: ${start_date}. `;
  }

  prompt += `Story context: ${story_text}. `;
  prompt += `The map should be visually cohesive, artistic, and suitable for framing. High resolution, detailed.`;

  return prompt;
}
