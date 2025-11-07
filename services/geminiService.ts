import { GoogleGenAI } from "@google/genai";

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
