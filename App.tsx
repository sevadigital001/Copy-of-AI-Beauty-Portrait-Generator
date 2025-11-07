// Fix: Implement the main App component with state management and UI for multimodal interaction. This resolves the errors caused by placeholder content.
import React, { useState, useRef, WheelEvent, MouseEvent } from 'react';
import { generateBeautyPortraitFromImage } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PhotoIcon } from './components/PhotoIcon';
import { UploadIcon } from './components/UploadIcon';
import { DownloadIcon } from './components/DownloadIcon';

// Helper to convert File to a format suitable for the Gemini API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result includes the Data URL prefix, which we need to remove.
      resolve((reader.result as string).split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const presets = [
  // Original Presets
  { name: 'Golden Hour Glow', prompt: 'Bathe the subject in the warm, soft, and diffused light of the golden hour. Create a dreamy, ethereal atmosphere with long, soft shadows and a beautiful, warm color palette. The skin should look radiant and glowing.' },
  { name: 'Cinematic Noir', prompt: 'Transform the portrait into a high-contrast, black and white cinematic noir style. Emphasize dramatic shadows and highlights, creating a sense of mystery and drama. The skin should be smooth but with preserved texture, and the eyes should be sharp and expressive.' },
  { name: 'Vibrant & Bold', prompt: 'Amplify the colors to be vibrant, rich, and saturated, creating a bold, high-fashion look. The lighting should be bright and even, making the subject pop. Skin should be flawless and makeup tones should be vivid.' },
  { name: 'Ethereal Fantasy', prompt: 'Create a magical, fantasy-inspired portrait. Add a soft, ethereal glow around the subject. The background should be subtly blurred and dreamlike. Enhance the eyes to have a slight sparkle and make the skin look luminous and otherworldly.' },
  { name: 'Vintage Film Look', prompt: 'Give the photo a timeless, vintage film aesthetic. Introduce subtle film grain, slightly desaturated colors, and a warm, nostalgic color cast. The lighting should feel natural and soft, like a classic film photograph.' },
  { name: 'Clean & Minimalist', prompt: 'Adopt a clean, minimalist, high-key lighting setup. The background should be a solid, light, neutral color. The focus should be entirely on the subject\'s natural beauty, with smooth skin, bright eyes, and a very clean, polished feel.' },
  { name: 'Cyberpunk Neon', prompt: 'Immerse the subject in a futuristic, cyberpunk environment. Use vibrant neon lights (pinks, purples, and blues) to cast dramatic, colored shadows and highlights on the face. The mood should be edgy and futuristic.' },
  { name: 'Soft Focus Dream', prompt: 'Apply a soft-focus effect to create a dreamy, romantic, and gentle portrait. The image should have a gentle haze, with soft edges and a beautiful, flattering blur. Keep the eyes as the sharpest point of focus.' },
  { name: 'Dramatic Rembrandt Lighting', prompt: 'Use classic Rembrandt lighting, with a strong key light creating a triangle of light on the shadowed side of the face. This should create a dramatic, moody, and painterly effect with deep shadows and rich tones.' },
  { name: 'Sun-Kissed Freckles', prompt: 'Enhance the portrait to look naturally sun-kissed. Add or enhance natural-looking freckles across the nose and cheeks. The lighting should be bright and warm, as if from a summer day, giving the skin a healthy, happy glow.' },

  // New Presets from previous step
  { name: 'Magazine Cover Look', prompt: 'Recreate the look of a high-fashion magazine cover. The lighting should be flawless and professional. Skin must be perfectly airbrushed to remove all blemishes and imperfections, but retain a natural texture. Eyes should be exceptionally sharp and vibrant. Enhance makeup to look professionally applied and color-grade the image for a polished, commercial feel.' },
  { name: 'Natural Radiance Enhance', prompt: 'Subtly enhance the subject\'s natural beauty. Even out the skin tone, reduce minor blemishes, and add a soft, healthy glow. Brighten the eyes just enough to make them pop. The final result should look like the person on their best day, with minimal to no visible makeup effect.' },
  { name: 'Professional Studio Polish', prompt: 'Emulate a professional studio headshot. Use clean, balanced lighting to sculpt the face. Sharpen key details like eyelashes, hair, and pupils to be crystal clear. Smooth the skin for a clean finish but preserve realistic texture. The background should be clean and non-distracting.' },
  { name: 'Flawless Complexion Filter', prompt: 'The primary goal is perfect skin. Meticulously remove all wrinkles, fine lines, acne, spots, and blemishes. Even out skin tone and texture completely for a smooth, flawless complexion. The effect should be significant but believable.' },
  { name: 'Hyper-Sharp Details', prompt: 'Make the entire portrait incredibly sharp and detailed. Enhance the texture of the skin, the fabric of clothing, and individual strands of hair. Increase micro-contrast to make every detail stand out. This is for a high-definition, impactful look.' },
  { name: 'Captivating Eyes Focus', prompt: 'Make the eyes the undeniable focal point. Increase the brightness and saturation of the iris color. Add a clear, sharp catchlight to each eye. Sharpen the eyelashes and define the eyebrows. The rest of the face should be slightly softer to draw all attention to the eyes.' },
  { name: 'Gentle Age Rewind', prompt: 'Apply a subtle, tasteful retouching to create a more youthful and refreshed appearance. Gently soften fine lines and wrinkles, especially around the eyes and mouth. Reduce under-eye circles and brighten the overall complexion for a rested, revitalized look.' },
  { name: 'Porcelain Skin Finish', prompt: 'Create a perfectly smooth, almost poreless skin finish, similar to a porcelain doll. The skin should have an even, matte texture with very soft, diffused light. This is an artistic, idealized skin effect.' },
  { name: 'HD Glamour Shot', prompt: 'Produce a modern glamour shot. Combine flawless skin smoothing with high-definition sharpness. Enhance makeup with rich, defined colors. Use dramatic lighting to sculpt the face and create a luxurious, high-end feel. The image should be bold and captivating.' },
  { name: 'Perfectly Natural Makeup', prompt: 'Apply the effect of perfect, natural-looking makeup. Even out the skin tone with a light foundation effect, add a touch of natural-looking blush, subtly define the lips with a neutral color, and enhance the eyes with clean mascara and eyeliner. The result should be polished and refined, not heavy.' },

  // Newest Presets
  { name: 'Ultra Sharpness', prompt: 'Push the sharpness to the maximum for an intensely crisp and defined look. Every edge, from eyelashes to strands of hair, should be razor-sharp. Apply a high-pass sharpening filter effect for extreme clarity and impact.' },
  { name: 'High Detail Texture', prompt: 'Focus on enhancing and revealing fine textures. Subtly accentuate skin pores for a realistic but flattering look, define the weave of fabric, and bring out the micro-details in hair and eyes. The goal is a highly detailed, textured, and tactile image.' },
];

const backgroundPresets = [
    { name: 'Professional Studio Gray', prompt: 'a clean, seamless, professional studio background with a neutral gray color.' },
    { name: 'Warm, Cozy Cafe', prompt: 'a warm and inviting cafe with soft, ambient lighting and a blurred background of bookshelves and coffee equipment.' },
    { name: 'Lush Garden Bokeh', prompt: 'a vibrant, lush garden with rich green foliage and colorful flowers, beautifully blurred into a creamy bokeh.' },
    { name: 'Futuristic Cityscape', prompt: 'a neon-lit, futuristic cityscape at night, with towering skyscrapers and reflections on wet streets.' },
    { name: 'Serene Beach at Sunset', prompt: 'a tranquil beach at sunset, with golden light reflecting on calm waves and soft, sandy shores.' },
    { name: 'Dramatic Mountain Peak', prompt: 'a majestic, dramatic mountain peak with epic clouds and a vast, scenic landscape.' },
    { name: 'Vintage Library', prompt: 'a classic, vintage library with tall, dark wood shelves filled with old books, creating a scholarly atmosphere.' },
    { name: 'Abstract Light Trails', prompt: 'an abstract background of colorful, glowing light trails, creating a dynamic and energetic feel.' },
];


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedBackgroundPrompt, setSelectedBackgroundPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Zoom Modal State
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setGeneratedImage(null); // Clear previous generation
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPresetPrompt = event.target.value;
    setPrompt(selectedPresetPrompt);
  };
  
  const handleBackgroundPresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBackgroundPrompt(event.target.value);
  };

  const handleSubmit = async () => {
    if (!prompt || !uploadedFile) {
      setError('Please upload a photo and enter a description.');
      return;
    }
    setError(null);
    setLoading(true);
    setGeneratedImage(null);

    try {
      const imagePart = await fileToGenerativePart(uploadedFile);
      const imageUrl = await generateBeautyPortraitFromImage(prompt, selectedBackgroundPrompt, imagePart);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError('An error occurred while generating the image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const fileName = uploadedFile?.name.replace(/\.[^/.]+$/, "") || 'ai-portrait';
    link.download = `${fileName}-enhanced.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Zoom Handlers
  const openZoom = (image: string) => {
    setZoomedImage(image);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const closeZoom = () => {
    setZoomedImage(null);
  }
  
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const newScale = scale - e.deltaY * 0.001;
    // Clamp scale between a min and max value
    setScale(Math.min(Math.max(0.5, newScale), 5));
  };
  
  const handleMouseDown = (e: MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).style.cursor = 'grabbing';
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y
    });
  };
  
  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  };

  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white font-sans flex items-center justify-center p-4">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-7xl">
          
          {/* Left Column: Controls */}
          <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-2xl sticky top-8">
            <header>
              <h1 className="text-4xl font-bold text-purple-400">AI Beauty Portrait Generator</h1>
              <p className="text-gray-400 mt-2">
                Upload a photo and describe your vision to generate a stunning, enhanced portrait.
              </p>
            </header>

            {/* File Uploader */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-lg">1. Upload Your Photo</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700 hover:border-purple-500 transition-colors disabled:opacity-50"
              >
                <UploadIcon className="w-12 h-12 text-gray-500 mb-2" />
                <span className="font-semibold text-gray-300">
                  {uploadedFile ? uploadedFile.name : 'Click to upload a photo'}
                </span>
                <span className="text-sm text-gray-500">PNG or JPG</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label htmlFor="prompt" className="font-semibold text-lg">2. Describe Your Vision or Choose a Preset</label>
              <select 
                onChange={handlePresetChange}
                disabled={loading}
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a preset style...</option>
                {presets.map(p => <option key={p.name} value={p.prompt}>{p.name}</option>)}
              </select>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Make the lighting soft and cinematic, reminiscent of the golden hour. Enhance the eyes to be more captivating and add a subtle, healthy glow to the skin..."
                className="w-full h-32 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                disabled={loading}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="background-prompt" className="font-semibold text-lg">3. (Optional) Change Background</label>
              <select 
                id="background-prompt"
                onChange={handleBackgroundPresetChange}
                disabled={loading}
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Keep original background...</option>
                {backgroundPresets.map(p => <option key={p.name} value={p.prompt}>{p.name}</option>)}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !prompt || !uploadedFile}
              className="w-full py-3 px-4 bg-purple-600 rounded-lg font-bold text-lg hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <><LoadingSpinner className="w-6 h-6" /> Generating...</> : 'Generate Portrait'}
            </button>
            {error && <p className="text-red-500 text-center mt-2">{error}</p>}
          </div>

          {/* Right Column: Image Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Image */}
              <div className="flex flex-col items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-400">Before</h2>
                  <div 
                    className="bg-gray-800 rounded-lg shadow-2xl aspect-square flex items-center justify-center p-2 w-full group overflow-hidden"
                    onClick={() => uploadedImagePreview && openZoom(uploadedImagePreview)}
                  >
                  {uploadedImagePreview ? (
                      <img 
                      src={uploadedImagePreview} 
                      alt="Uploaded original" 
                      className="w-full h-full object-contain rounded-md group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                      />
                  ) : (
                      <div className="text-center text-gray-500 p-4">
                          <PhotoIcon className="w-16 h-16 mx-auto mb-2" />
                          <p>Upload a photo to begin</p>
                      </div>
                  )}
                  </div>
              </div>

               {/* Generated Image */}
              <div className="flex flex-col items-center gap-2">
                  <h2 className="text-xl font-bold text-purple-400">After</h2>
                  <div 
                    className="bg-gray-800 rounded-lg shadow-2xl aspect-square flex items-center justify-center p-2 w-full group overflow-hidden"
                    onClick={() => generatedImage && openZoom(generatedImage)}
                    >
                      {loading ? (
                          <div className="flex flex-col items-center text-gray-400 p-4">
                              <LoadingSpinner className="w-12 h-12 mb-4" />
                              <p className="text-lg text-center">The AI is enhancing your photo...</p>
                          </div>
                      ) : generatedImage ? (
                          <img 
                          src={generatedImage} 
                          alt="Generated AI beauty portrait" 
                          className="w-full h-full object-contain rounded-md group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                          />
                      ) : (
                          <div className="text-center text-gray-500 p-4">
                              <PhotoIcon className="w-16 h-16 mx-auto mb-2" />
                              <p>Your generated portrait will appear here</p>
                          </div>
                      )}
                  </div>
                  {generatedImage && !loading && (
                    <button
                        onClick={handleDownload}
                        className="mt-4 w-full py-2 px-4 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Download Image
                    </button>
                  )}
              </div>
          </div>

        </div>
      </div>
      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={closeZoom}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <img 
                src={zoomedImage}
                alt="Zoomed view"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-100"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  cursor: scale > 1 ? 'grab' : 'zoom-in',
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()} // Prevent click on image from closing modal
            />
            <button
                onClick={closeZoom}
                className="absolute top-4 right-6 text-white text-5xl font-bold hover:text-purple-400 transition-colors"
                aria-label="Close zoom"
            >
                &times;
            </button>
        </div>
      )}
    </>
  );
};

export default App;