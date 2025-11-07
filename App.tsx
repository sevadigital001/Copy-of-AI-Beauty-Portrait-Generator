import React, { useState, useCallback } from 'react';
import { generateBeautyImage } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PhotoIcon } from './components/PhotoIcon';

function App() {
  const [prompt, setPrompt] = useState<string>('A woman with vibrant, galaxy-colored hair, freckles that look like constellations, and iridescent lipstick');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const imageUrl = await generateBeautyImage(prompt);
      setGeneratedImageUrl(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Side: Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-8 self-start">
          <header className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
              AI Beauty Portrait
            </h1>
            <p className="mt-2 text-purple-300/80">
              Create breathtaking portraits with the power of AI.
            </p>
          </header>

          <div className="flex flex-col gap-4">
            <label htmlFor="prompt" className="text-lg font-medium text-purple-200">
              Describe Your Vision
            </label>
            <textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A portrait of a woman with flowing ethereal hair made of light..."
              className="w-full p-4 bg-gray-800/60 border-2 border-purple-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 text-gray-200 placeholder-gray-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerateImage}
            disabled={isLoading || !prompt}
            className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg shadow-lg hover:shadow-pink-500/40 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              '✨ Generate Image'
            )}
          </button>
        </div>

        {/* Right Side: Image Display */}
        <main className="w-full lg:w-2/3 flex-grow">
          <div className="aspect-[3/4] w-full bg-gray-800/50 rounded-2xl border-2 border-dashed border-purple-500/30 flex items-center justify-center overflow-hidden relative">
            {isLoading && (
              <div className="z-10 absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 transition-opacity duration-300">
                <LoadingSpinner className="w-12 h-12" />
                <p className="text-lg text-purple-200 animate-pulse">Creating your masterpiece...</p>
              </div>
            )}
            
            {error && (
              <div className="p-8 text-center text-red-400">
                <h3 className="text-xl font-bold mb-2">Generation Failed</h3>
                <p>{error}</p>
              </div>
            )}
            
            {!isLoading && !error && generatedImageUrl && (
              <img
                src={generatedImageUrl}
                alt="Generated beauty portrait"
                className="w-full h-full object-cover transition-opacity duration-500 animate-fade-in"
              />
            )}
            
            {!isLoading && !error && !generatedImageUrl && (
              <div className="text-center text-purple-400/60 p-8 flex flex-col items-center gap-4">
                <PhotoIcon className="w-24 h-24" />
                <h2 className="text-2xl font-semibold">Your Image Will Appear Here</h2>
                <p>Describe the portrait you want to create and click "Generate Image" to start.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
