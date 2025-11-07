// Fix: Implement the Gemini service to handle multimodal image generation.
import { GoogleGenAI, Modality, InlineDataPart } from "@google/genai";

// As per guidelines, initialize with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an enhanced beauty portrait from an uploaded image and a text prompt.
 * @param prompt The text description of the desired enhancements for the subject.
 * @param backgroundPrompt Optional text description for the desired background.
 * @param aspectRatio Optional desired aspect ratio for the final image (e.g., "1:1", "9:16").
 * @param imagePart The user's uploaded image as a Gemini InlineDataPart.
 * @returns A data URL (base64) of the generated image.
 */
export const generateBeautyPortraitFromImage = async (
  prompt: string, 
  backgroundPrompt: string, 
  aspectRatio: string,
  imagePart: InlineDataPart
): Promise<string> => {
  try {
    // Construct a detailed, multi-step prompt for the model.
    const fullPrompt = `
      Enhance this photo into a stunning, professional beauty portrait. Follow these instructions carefully and in order.

      **A. Core Image Corrections (Apply these ALWAYS, before the user's style):**
      1.  **Perfect Lighting:** Analyze the lighting on the subject. If any areas are underexposed or too dark, intelligently brighten them to reveal detail without washing them out. If any areas are overexposed or have harsh highlights, recover the detail and balance them. The final lighting on the subject should be even, flattering, and perfectly exposed.
      2.  **Subject Sharpening:** If the subject in the original photo appears slightly blurry or soft, apply a natural-looking sharpening effect to make them crisp and clear. Focus the sharpening on key features like the eyes, lips, and hair. Avoid creating artificial halos or over-sharpening.
      3.  **Natural Color Balance:** Ensure the final image has natural, true-to-life colors. Skin tones must be accurate and healthy-looking. The overall color balance should be similar to a high-quality photograph from a flagship smartphone (like an iPhone) under optimal lighting conditions—vibrant but realistic and not oversaturated.

      **B. User-Requested Style (Apply AFTER core corrections):**
      1.  **Subject Enhancement:** Apply the following artistic style to the person in the photo: "${prompt}". It is absolutely crucial to maintain the original person's facial features and identity. Only enhance their quality and style according to this specific prompt.
      ${backgroundPrompt 
        ? `2. **Background Replacement:** Replace the original background with this scene: "${backgroundPrompt}". Ensure the lighting, shadows, and color temperature on the subject match the new background seamlessly for a realistic composition.` 
        : ''
      }
      ${aspectRatio
        ? `3. **Aspect Ratio:** The final output image MUST have an aspect ratio of exactly ${aspectRatio}. Intelligently crop or extend the scene (content-aware fill) to fit this new shape. The subject must remain the primary focus and should not be awkwardly cropped.`
        : ''
      }
      
      Execute these steps to produce the final, high-quality image.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            imagePart,
            { text: fullPrompt.trim() }
          ]
        },
        config: {
          // Per guidelines, specify IMAGE as the response modality.
          responseModalities: [Modality.IMAGE],
        },
    });

    // Per guidelines, find the image part in the response.
    const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!imageResponsePart?.inlineData) {
        throw new Error("No image data received from the API.");
    }
    
    const base64ImageBytes = imageResponsePart.inlineData.data;
    const mimeType = imageResponsePart.inlineData.mimeType;

    return `data:${mimeType};base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image from Gemini API.");
  }
};