import React, { useState, useCallback, useRef } from 'react';
import { generateBeautyImage, retouchBeautyImage } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PhotoIcon } from './components/PhotoIcon';
import { UploadIcon } from './components/UploadIcon';

type Mode = 'generate' | 'retouch';

interface RetouchSettings {
  smoothing: number;
  brightening: number;
  whitening: number;
}

function App() {
  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState<string>('A woman with vibrant, galaxy-colored hair, freckles that look like constellations, and iridescent lipstick');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retouchSettings, setRetouchSettings] = useState<RetouchSettings>({
    smoothing: 50,
    brightening: 50,
    whitening: 30,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setOriginalImageUrl(null);

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

  const handleRetouchImage = useCallback(async () => {
    if (!originalImageUrl || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const { base64, mimeType } = await dateUrlToBase64(originalImageUrl);
      const imageUrl = await retouchBeautyImage(base64, mimeType, retouchSettings);
      setGeneratedImageUrl(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImageUrl, isLoading, retouchSettings]);


  const dateUrlToBase64 = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new Promise<{ base64: string, mimeType: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
          return reject(new Error("Failed to read file"));
        }
        const base64String = reader.result.split(',')[1];
        resolve({ base64: base64String, mimeType: blob.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImageUrl(e.target?.result as string);
        setGeneratedImageUrl(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRetouchSettings(prev => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const isRetouchButtonDisabled = isLoading || !originalImageUrl;
  const isGenerateButtonDisabled = isLoading || !prompt;

  const displayImageUrl = generatedImageUrl || originalImageUrl;

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
              Create or enhance breathtaking portraits with AI.
            </p>
          </header>

          {/* Mode Tabs */}
          <div className="flex bg-gray-800/60 border border-purple-500/30 rounded-lg p-1">
            <button onClick={() => setMode('generate')} className={`w-1/2 py-2 rounded-md transition-colors duration-300 ${mode === 'generate' ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-500/20'}`}>Generate</button>
            <button onClick={() => setMode('retouch')} className={`w-1/2 py-2 rounded-md transition-colors duration-300 ${mode === 'retouch' ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-500/20'}`}>Retouch</button>
          </div>

          {mode === 'generate' ? (
            <>
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
                disabled={isGenerateButtonDisabled}
                className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg shadow-lg hover:shadow-pink-500/40 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isLoading && mode === 'generate' ? (<><LoadingSpinner /> Generating...</>) : ('✨ Generate Image')}
              </button>
            </>
          ) : (
            <>
              {!originalImageUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 flex flex-col items-center justify-center gap-2 bg-gray-800/60 border-2 border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:bg-purple-500/20 transition-colors"
                >
                  <UploadIcon className="w-10 h-10 text-purple-400" />
                  <p className="text-purple-300">Upload a photo to retouch</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4 bg-gray-800/60 border border-purple-500/30 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-200">Adjustments</h3>
                  {/* Skin Smoothing */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="smoothing" className="text-gray-300">Skin Smoothing</label>
                      <span className="text-purple-300 font-mono">{retouchSettings.smoothing}%</span>
                    </div>
                    <input type="range" id="smoothing" name="smoothing" min="0" max="100" value={retouchSettings.smoothing} onChange={handleSliderChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                  </div>
                   {/* Eye Brightening */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="brightening" className="text-gray-300">Eye Brightening</label>
                      <span className="text-purple-300 font-mono">{retouchSettings.brightening}%</span>
                    </div>
                    <input type="range" id="brightening" name="brightening" min="0" max="100" value={retouchSettings.brightening} onChange={handleSliderChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  {/* Teeth Whitening */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="whitening" className="text-gray-300">Teeth Whitening</label>
                      <span className="text-purple-300 font-mono">{retouchSettings.whitening}%</span>
                    </div>
                    <input type="range" id="whitening" name="whitening" min="0" max="100" value={retouchSettings.whitening} onChange={handleSliderChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              )}
               <button
                onClick={handleRetouchImage}
                disabled={isRetouchButtonDisabled}
                className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg shadow-lg hover:shadow-teal-500/40 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isLoading && mode === 'retouch' ? (<><LoadingSpinner /> Retouching...</>) : ('✨ Retouch Photo')}
              </button>
            </>
          )}

        </div>

        {/* Right Side: Image Display */}
        <main className="w-full lg:w-2/3 flex-grow">
          <div className="aspect-[3/4] w-full bg-gray-800/50 rounded-2xl border-2 border-dashed border-purple-500/30 flex items-center justify-center overflow-hidden relative">
            {isLoading && (
              <div className="z-10 absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 transition-opacity duration-300">
                <LoadingSpinner className="w-12 h-12" />
                <p className="text-lg text-purple-200 animate-pulse">
                  {mode === 'generate' ? 'Creating your masterpiece...' : 'Applying enhancements...'}
                </p>
              </div>
            )}
            
            {error && (
              <div className="p-8 text-center text-red-400">
                <h3 className="text-xl font-bold mb-2">Operation Failed</h3>
                <p>{error}</p>
              </div>
            )}
            
            {!isLoading && !error && displayImageUrl && (
              <img
                src={displayImageUrl}
                alt={mode === 'generate' ? 'Generated beauty portrait' : 'Retouched portrait'}
                className="w-full h-full object-cover transition-opacity duration-500 animate-fade-in"
              />
            )}
            
            {!isLoading && !error && !displayImageUrl && (
              <div className="text-center text-purple-400/60 p-8 flex flex-col items-center gap-4">
                <PhotoIcon className="w-24 h-24" />
                <h2 className="text-2xl font-semibold">Your Image Will Appear Here</h2>
                <p>
                  {mode === 'generate'
                    ? 'Describe the portrait you want to create and click "Generate Image" to start.'
                    : 'Upload a photo to begin the retouching process.'
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;