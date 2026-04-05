import React, { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, Share, Edit3, User, Activity, Clock, Map, FileText, ChevronRight, Zap, X, GitBranch, Trash2 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc, or } from 'firebase/firestore';
import { generateCharacter, generatePortraitDescription, generatePortraitUrl } from '../../services/aiService';

interface Story {
  id: string;
  title: string;
  authorId: string;
  collaborators?: string[];
}

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  quirk?: string;
  imageUrl: string;
  authorId: string;
  createdAt: number;
}

export default function LoreForge() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [showPortraitGenerator, setShowPortraitGenerator] = useState(false);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editCharData, setEditCharData] = useState({ name: '', role: '', description: '', quirk: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'stories'),
      or(
        where('authorId', '==', auth.currentUser.uid),
        where('collaborators', 'array-contains', auth.currentUser.uid)
      )
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedStories: Story[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.authorId === auth.currentUser?.uid || (data.collaborators && data.collaborators.includes(auth.currentUser?.uid))) {
          loadedStories.push({ id: doc.id, ...data } as Story);
        }
      });
      setStories(loadedStories);
      if (loadedStories.length > 0 && !activeStoryId) {
        setActiveStoryId(loadedStories[0].id);
      }
    });

    return () => unsubscribe();
  }, [activeStoryId]);

  useEffect(() => {
    if (!activeStoryId || !auth.currentUser) return;

    const q = query(collection(db, 'stories', activeStoryId, 'characters'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedChars: Character[] = [];
      snapshot.forEach((doc) => {
        loadedChars.push({ id: doc.id, ...doc.data() } as Character);
      });
      setCharacters(loadedChars);
      if (loadedChars.length > 0 && !activeCharacterId) {
        setActiveCharacterId(loadedChars[0].id);
      } else if (loadedChars.length === 0) {
        setActiveCharacterId(null);
      }
    });

    return () => unsubscribe();
  }, [activeStoryId, activeCharacterId]);

  const activeCharacter = characters.find(c => c.id === activeCharacterId);

  const handleGeneratePortrait = async () => {
    if (!activeCharacter) return;
    setIsGenerating(true);
    try {
      // Use AI to generate a unique portrait description and then create a unique image URL
      const portraitData = await generatePortraitDescription(
        activeCharacter.name,
        activeCharacter.description,
        'Digital Art'
      );
      
      // Generate a unique portrait URL using the AI-generated keywords
      const portraitUrl = generatePortraitUrl(activeCharacter.name, portraitData.seedKeywords);
      setGeneratedImageUrl(portraitUrl);
      showToast('Portrait generated with AI!', 'success');
    } catch (error: any) {
      console.error("Error generating portrait:", error);
      
      // Fallback to basic random portrait
      const fallbackUrl = `https://picsum.photos/seed/${activeCharacter.name}-${Date.now()}/400/500`;
      setGeneratedImageUrl(fallbackUrl);
      showToast('Portrait generated!', 'success');
    }
    setIsGenerating(false);
  };

  const handleSavePortrait = async () => {
    if (!activeStoryId || !activeCharacterId || !generatedImageUrl) return;
    try {
      await updateDoc(doc(db, 'stories', activeStoryId, 'characters', activeCharacterId), {
        imageUrl: generatedImageUrl
      });
      setGeneratedImageUrl(null);
      setShowPortraitGenerator(false);
    } catch (error) {
      console.error("Error saving portrait:", error);
    }
  };

  const handleEditProfile = () => {
    if (!activeCharacter) return;
    setEditCharData({
      name: activeCharacter.name,
      role: activeCharacter.role,
      description: activeCharacter.description,
      quirk: activeCharacter.quirk || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!activeStoryId || !activeCharacterId) return;
    try {
      await updateDoc(doc(db, 'stories', activeStoryId, 'characters', activeCharacterId), {
        ...editCharData
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleGenerateAICharacter = async () => {
    setIsGenerating(true);
    try {
      const character = await generateCharacter('fantasy');
      setNewCharName(character.name);
      setNewCharRole(character.role);
      showToast('AI character generated! Review and click Create.', 'success');
    } catch (error: any) {
      console.error("Error generating AI character:", error);
      showToast(error.message || 'Failed to generate character. Please try again.', 'error');
    }
    setIsGenerating(false);
  };

  const handleAddCharacter = async () => {
    if (!activeStoryId || !newCharName.trim() || !auth.currentUser) return;
    
    try {
      await addDoc(collection(db, 'stories', activeStoryId, 'characters'), {
        name: newCharName,
        role: newCharRole || 'Supporting',
        description: 'A new character in the story.',
        imageUrl: `https://picsum.photos/seed/${newCharName.replace(/\s+/g, '')}/400/400`,
        authorId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setNewCharName('');
      setNewCharRole('');
      setIsAddingCharacter(false);
      showToast('Character added successfully!', 'success');
    } catch (error: any) {
      console.error("Error adding character:", error);
      showToast(error.message || 'Failed to add character.', 'error');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!activeStoryId) return;
    try {
      await deleteDoc(doc(db, 'stories', activeStoryId, 'characters', charId));
      if (activeCharacterId === charId) {
        setActiveCharacterId(null);
      }
    } catch (error) {
      console.error("Error deleting character:", error);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0A0B10] text-gray-300 font-sans relative">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0F111A] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="text-xs font-semibold text-gray-500 tracking-wider mb-2">ACTIVE PROJECT</div>
          <select 
            className="w-full bg-[#1A1C23] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-4"
            value={activeStoryId || ''}
            onChange={(e) => setActiveStoryId(e.target.value)}
          >
            {stories.map(story => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
            {stories.length === 0 && <option value="">No projects found</option>}
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search characters..." 
              className="w-full bg-[#1A1C23] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-4">
            <div className="text-[10px] font-bold text-gray-500 tracking-wider mb-3 px-2 uppercase">Characters</div>
            <div className="space-y-1">
              {characters.map(char => (
                <button 
                  key={char.id}
                  onClick={() => setActiveCharacterId(char.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors group ${activeCharacterId === char.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${char.imageUrl})` }}></div>
                    <div className="text-left">
                      <div className={`text-sm font-bold ${activeCharacterId === char.id ? 'text-indigo-400' : 'text-white'}`}>{char.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{char.role}</div>
                    </div>
                  </div>
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(char.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              ))}
              {characters.length === 0 && (
                <div className="text-sm text-gray-500 px-3 py-2">No characters found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setIsAddingCharacter(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium text-white"
          >
            <Plus size={16} />
            New Character
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto p-8 relative transition-all duration-300 ${showPortraitGenerator ? 'mr-96' : ''}`}>
        {activeCharacter ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex items-start gap-8">
              <div className="w-48 h-48 rounded-2xl bg-cover bg-center border border-white/10 shadow-2xl shrink-0 relative overflow-hidden group" style={{ backgroundImage: `url(${activeCharacter.imageUrl})` }}>
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">AI Generated</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button onClick={() => setShowPortraitGenerator(true)} className="w-full py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded text-xs font-bold text-white transition-colors">Update Portrait</button>
                </div>
              </div>
              
              <div className="flex-1 pt-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white tracking-tight">{activeCharacter.name}</h1>
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">{activeCharacter.role}</span>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
                      {activeCharacter.description}
                    </p>
                    {activeCharacter.quirk && (
                      <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Unique Quirk</span>
                        <p className="text-sm text-gray-300 italic">"{activeCharacter.quirk}"</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Unknown Age</span>
                      <span className="bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Unknown Species</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium text-white transition-colors">
                      <Share size={16} />
                      Export
                    </button>
                    <button 
                      onClick={handleEditProfile}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors"
                    >
                      <Edit3 size={16} />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* Core Traits */}
              <div className="col-span-1 bg-[#12131A] border border-white/5 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Activity size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Core Traits</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className="text-gray-400">Pragmatism vs Idealism</span>
                      <span className="text-white">65%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className="text-gray-400">Mercy vs Justice</span>
                      <span className="text-white">42%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className="text-gray-400">Stability vs Chaos</span>
                      <span className="text-white">88%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Arc Timeline */}
              <div className="col-span-2 bg-[#12131A] border border-white/5 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-8">
                  <Clock size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Character Arc Timeline</h3>
                </div>
                
                <div className="relative pt-4 pb-8">
                  {/* Timeline Line */}
                  <div className="absolute top-6 left-4 right-4 h-0.5 bg-white/10"></div>
                  
                  <div className="flex justify-between relative z-10">
                    {/* Point 1 */}
                    <div className="flex flex-col items-center w-32 -ml-16">
                      <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Act I</div>
                      <div className="w-1 h-3 bg-indigo-500 mb-3"></div>
                    </div>
                    
                    {/* Point 2 */}
                    <div className="flex flex-col items-center w-32 -ml-16">
                      <div className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-wider">Current</div>
                      <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-[#12131A] shadow-[0_0_10px_rgba(99,102,241,0.5)] mb-2.5"></div>
                    </div>
                    
                    {/* Point 3 */}
                    <div className="flex flex-col items-center w-32 -mr-16">
                      <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Act III</div>
                      <div className="w-1 h-3 bg-gray-700 mb-3"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LoreForge Intelligence */}
              <div className="col-span-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">LoreForge Intelligence</h4>
                    <p className="text-sm text-indigo-200/70">I can analyze how {activeCharacter.name}'s portrait should change based on their arc.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">Dismiss</button>
                  <button onClick={() => setShowPortraitGenerator(true)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors">Generate New Era</button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select or create a character to view their LoreForge profile.
          </div>
        )}
      </div>

      {/* Add Character Modal */}
      {isAddingCharacter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-[#12131A] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create New Character</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGenerateAICharacter}
                  disabled={isGenerating}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Sparkles size={14} />
                  AI Generate
                </button>
                <button onClick={() => setIsAddingCharacter(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
            </div>
            <input 
              type="text" 
              placeholder="Character Name" 
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
              autoFocus
            />
            <input 
              type="text" 
              placeholder="Role (e.g., Protagonist, Antagonist)" 
              value={newCharRole}
              onChange={(e) => setNewCharRole(e.target.value)}
              className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAddingCharacter(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleAddCharacter} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Portrait Generator Side Panel */}
      {showPortraitGenerator && activeCharacter && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-[#12131A] border-l border-white/5 shadow-2xl flex flex-col z-20 animate-in slide-in-from-right">
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-white">Portrait Generator</h2>
              <p className="text-[10px] text-gray-500">Update {activeCharacter.name}'s appearance</p>
            </div>
            <button onClick={() => setShowPortraitGenerator(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {generatedImageUrl && (
              <div className="mb-6">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preview</div>
                <img src={generatedImageUrl} alt="Generated" className="w-full aspect-square rounded-xl border border-indigo-500 shadow-lg shadow-indigo-500/20" />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</div>
                <button className="text-[10px] text-indigo-400 hover:underline">Sync from Profile</button>
              </div>
              <textarea 
                defaultValue={activeCharacter.description}
                className="w-full h-40 bg-[#0A0B10] border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Artistic Style</div>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-indigo-500 bg-indigo-500/10">
                  <div className="w-full aspect-square rounded bg-cover bg-center" style={{ backgroundImage: 'url(https://picsum.photos/seed/style1/100/100)' }}></div>
                  <span className="text-[10px] font-bold text-indigo-400">Digital Art</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-[#0A0B10] hover:bg-white/5">
                  <div className="w-full aspect-square rounded bg-cover bg-center opacity-70" style={{ backgroundImage: 'url(https://picsum.photos/seed/style2/100/100)' }}></div>
                  <span className="text-[10px] font-bold text-gray-400">Cinematic</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-[#0A0B10] hover:bg-white/5">
                  <div className="w-full aspect-square rounded bg-cover bg-center opacity-70" style={{ backgroundImage: 'url(https://picsum.photos/seed/style3/100/100)' }}></div>
                  <span className="text-[10px] font-bold text-gray-400">Oil Painting</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consistency Strength</div>
                <span className="text-xs text-gray-400">High (0.85)</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="85" className="w-full accent-indigo-500" />
              <p className="text-[10px] text-gray-500 mt-2 italic">Higher strength ensures the character keeps recognizable facial features across generations.</p>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-[#0F111A] space-y-3">
            <button 
              onClick={handleGeneratePortrait}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
            >
              {isGenerating ? <Zap size={16} className="animate-pulse" /> : <Sparkles size={16} />}
              {isGenerating ? 'Generating...' : 'Regenerate Portrait'}
            </button>
            <button 
              onClick={handleSavePortrait}
              disabled={!generatedImageUrl}
              className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors text-sm font-bold text-white"
            >
              Save as Current
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-[#12131A] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Character Profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</label>
                <input 
                  type="text" 
                  value={editCharData.name}
                  onChange={(e) => setEditCharData({ ...editCharData, name: e.target.value })}
                  className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                <input 
                  type="text" 
                  value={editCharData.role}
                  onChange={(e) => setEditCharData({ ...editCharData, role: e.target.value })}
                  className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  rows={5}
                  value={editCharData.description}
                  onChange={(e) => setEditCharData({ ...editCharData, description: e.target.value })}
                  className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unique Quirk</label>
                <input 
                  type="text" 
                  placeholder="e.g., Always carries a silver coin"
                  value={editCharData.quirk}
                  onChange={(e) => setEditCharData({ ...editCharData, quirk: e.target.value })}
                  className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSaveProfile} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}
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
