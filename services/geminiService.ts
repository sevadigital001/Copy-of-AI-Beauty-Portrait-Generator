import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available in the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a beauty-themed image using the Gemini API (Imagen model).
 * @param userPrompt The user's description of the desired image.
 * @returns A promise that resolves to a base64 data URL of the generated image.
 */
export async function generateBeautyImage(userPrompt: string): Promise<string> {
  // Enhance the user prompt for better results
  const fullPrompt = `A photorealistic beauty portrait of ${userPrompt}, high fashion, intricate details, professional lighting, 8k, hyper-realistic`;

  try {
    console.log("Generating image with prompt:", fullPrompt);
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        // A 3:4 aspect ratio is great for portraits
        aspectRatio: '3:4',
      },
    });

    // Check if images were generated
    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("The API did not return any images.");
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    
    // Check if the image data is valid
    if (!base64ImageBytes) {
      throw new Error("The API returned an empty image.");
    }

    // Return the image as a data URL
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
    return imageUrl;

  } catch (error) {
    console.error("Error generating image:", error);
    // Provide a more user-friendly error message
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("The provided API key is not valid. Please check your configuration.");
    }
    throw new Error("Failed to generate image due to an API error.");
  }
}


/**
 * Retouches an image using the Gemini API based on specified settings.
 * @param base64ImageData The base64 encoded string of the image to retouch.
 * @param mimeType The MIME type of the image.
 * @param settings The retouch settings for smoothing, brightening, and whitening.
 * @returns A promise that resolves to a base64 data URL of the retouched image.
 */
export async function retouchBeautyImage(
  base64ImageData: string,
  mimeType: string,
  settings: { smoothing: number; brightening: number; whitening: number }
): Promise<string> {
  const { smoothing, brightening, whitening } = settings;

  const prompt = `
    Perform a professional, photorealistic beauty retouch on this portrait.
    - Apply skin smoothing with an intensity of ${smoothing}%. Focus on creating a natural, healthy-looking texture, not an artificial or plastic look.
    - Brighten the eyes with an intensity of ${brightening}%. Enhance the catchlights and add subtle sparkle to make them pop.
    - Whiten the teeth with an intensity of ${whitening}%. The result should be a natural, clean white, not an overly bright or artificial shade.
    Preserve all other details of the original image, including hair texture, background, and clothing. The enhancements should be subtle and blend seamlessly.
  `;

  try {
    console.log("Retouching image with settings:", settings);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const imageMimeType: string = part.inlineData.mimeType;
        return `data:${imageMimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("The API did not return an image after retouching.");

  } catch (error) {
    console.error("Error retouching image:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("The provided API key is not valid. Please check your configuration.");
    }
    throw new Error("Failed to retouch image due to an API error.");
  }
}