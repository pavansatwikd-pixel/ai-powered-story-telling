import React from 'react';
import { Book } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center text-white font-sans">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse shadow-[0_0_30px_rgba(79,70,229,0.5)]">
        <Book size={32} className="text-white" />
      </div>
      <h1 className="text-3xl font-black tracking-tight mb-2">StoryFlow AI</h1>
      <p className="text-gray-400 text-sm font-medium">Loading your universe...</p>
    </div>
  );
}
