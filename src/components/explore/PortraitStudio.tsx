import React, { useState } from 'react';
import { Grid, List, Sparkles } from 'lucide-react';
import { generatePortraitDescription, generatePortraitUrl } from '../../services/aiService';

export default function PortraitStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Oil Painting');
  const [mood, setMood] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [results, setResults] = useState<string[]>([
    'https://picsum.photos/seed/portrait1/400/500',
    'https://picsum.photos/seed/portrait2/400/500',
    'https://picsum.photos/seed/portrait3/400/500',
    'https://picsum.photos/seed/portrait4/400/500',
  ]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      // Use AI to generate portrait description and keywords
      const portraitData = await generatePortraitDescription(
        prompt,
        `${prompt}, style: ${style}, mood: ${mood}`,
        style
      );
      
      // Generate 4 variations using the AI-generated keywords
      const newResults: string[] = [];
      for (let i = 0; i < 4; i++) {
        const variationKeywords = [...portraitData.seedKeywords, `variation-${i}`];
        newResults.push(generatePortraitUrl(`${prompt}-${i}`, variationKeywords));
      }
      
      setResults(newResults);
      showToast('Portraits generated with AI!', 'success');
    } catch (e: any) {
      console.error("Error generating image:", e);
      
      // Fallback to basic generation
      const newResults: string[] = [];
      for (let i = 0; i < 4; i++) {
        newResults.push(`https://picsum.photos/seed/${prompt}-${i}-${Date.now()}/400/500`);
      }
      setResults(newResults);
      showToast('Portraits generated!', 'success');
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0A0B10] text-gray-300 font-sans">
      {/* Left Sidebar - Controls */}
      <div className="w-80 border-r border-white/5 bg-[#0F111A] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Physical Traits */}
          <div>
            <div className="text-xs font-bold text-indigo-400 tracking-wider mb-3 uppercase">Physical Traits</div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe features, hair, eyes, scars, clothing... (e.g. A weary knight with silver hair and a jagged scar across the left eye)"
              className="w-full h-32 bg-[#1A1C23] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Artistic Style */}
          <div>
            <div className="text-xs font-bold text-indigo-400 tracking-wider mb-3 uppercase">Artistic Style</div>
            <div className="grid grid-cols-2 gap-3">
              {['Oil Painting', 'Digital Art', 'Sketch', 'Cinematic'].map(s => (
                <button 
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${style === s ? 'bg-indigo-600 text-white' : 'bg-[#1A1C23] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {style === s && <Sparkles size={14} />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Mood & Atmosphere */}
          <div>
            <div className="text-xs font-bold text-indigo-400 tracking-wider mb-3 uppercase">Mood & Atmosphere</div>
            <input 
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Melancholic, Heroic, Eerie..."
              className="w-full bg-[#1A1C23] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {['Melancholic', 'Dark Fantasy', 'Mysterious'].map(m => (
                <button 
                  key={m}
                  onClick={() => setMood(m)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/20 transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              <span>Advanced Settings</span>
              <span className="text-xs">▼</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 bg-[#0F111A]">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Portraits
              </>
            )}
          </button>
          <div className="text-center mt-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            Consumes 1 Creation Credit
          </div>
        </div>
      </div>

      {/* Main Content - Results */}
      <div className="flex-1 flex flex-col relative bg-[#0A0B10]">
        {/* Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Generated Results</h2>
            <p className="text-sm text-gray-500">Found 4 variations based on your creative prompt.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#1A1C23] border border-white/10 rounded-lg p-1">
            <button className="p-2 rounded bg-white/10 text-white shadow-sm">
              <Grid size={16} />
            </button>
            <button className="p-2 rounded text-gray-500 hover:text-white transition-colors">
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
            {results.map((url, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 relative group bg-[#1A1C23]">
                <img src={url} alt={`Generated portrait ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors">
                      Save to Profile
                    </button>
                    <button className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-bold transition-colors">
                      Variations
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Status */}
        <div className="h-10 border-t border-white/5 bg-[#4F46E5] flex items-center justify-between px-6 text-[10px] font-bold text-white uppercase tracking-wider shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              AI Engine Online: GPT-V4 & Diffusion XL
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={12} />
              Average Gen Time: 8.4s
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:underline">Support Documentation</a>
            <a href="#" className="hover:underline">Terms of Creation</a>
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {toast.type === 'success' ? <span className="text-sm">✓</span> : <span className="text-sm">✕</span>}
          </div>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
