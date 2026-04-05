import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, GitBranch, Users, Image as ImageIcon } from 'lucide-react';
import StoryBranch from '../components/explore/StoryBranch';
import LoreForge from '../components/explore/LoreForge';
import PortraitStudio from '../components/explore/PortraitStudio';

export default function Explore() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'storybranch' | 'loreforge' | 'portrait'>('storybranch');

  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col font-sans">
      {/* Top Navigation for Explore Hub */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 gap-6 bg-[#12131A] shrink-0">
        <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="h-6 w-px bg-white/10"></div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('storybranch')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${activeTab === 'storybranch' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <GitBranch size={16} />
            <span>StoryBranch</span>
          </button>
          <button 
            onClick={() => setActiveTab('loreforge')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${activeTab === 'loreforge' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={16} />
            <span>LoreForge AI</span>
          </button>
          <button 
            onClick={() => setActiveTab('portrait')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${activeTab === 'portrait' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <ImageIcon size={16} />
            <span>AI Portrait Studio</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'storybranch' && <StoryBranch />}
        {activeTab === 'loreforge' && <LoreForge />}
        {activeTab === 'portrait' && <PortraitStudio />}
      </div>
    </div>
  );
}
