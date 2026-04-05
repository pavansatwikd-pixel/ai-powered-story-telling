import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book, History, Share, CheckCircle, Plus, Settings, Sparkles, Edit3, Wand2, UserSearch, RefreshCw, Send, Maximize2, Minimize2, Bold, Italic, Copy, X, Users, Ghost, Palette, Type, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot, arrayUnion, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import TiptapEditor from '../components/editor/TiptapEditor';
import { generateWritingSuggestion } from '../services/aiService';

export default function Editor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState<{id: string, title: string, content: string}[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const chaptersLoaded = useRef(false);
  const [aiInput, setAiInput] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'muse' | 'characters'>('muse');
  const [characters, setCharacters] = useState<any[]>([]);
  const [collabEmail, setCollabEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [editorBgColor, setEditorBgColor] = useState('#0A0B10');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bgColors = [
    { name: 'Midnight', value: '#0A0B10' },
    { name: 'Deep Space', value: '#121118' },
    { name: 'Charcoal', value: '#1A1C23' },
    { name: 'Sepia', value: '#2D241E' },
    { name: 'Forest', value: '#1B241B' },
  ];

  useEffect(() => {
    if (!id) return;
    chaptersLoaded.current = false;

    const docRef = doc(db, 'stories', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStory({ _id: docSnap.id, ...data });
        
        if (!chaptersLoaded.current) {
          let loadedChapters = data.chapters;
          if (!loadedChapters || loadedChapters.length === 0) {
            loadedChapters = [{ id: '1', title: 'Chapter 1', content: data.content || '' }];
          }
          setChapters(loadedChapters);
          setActiveChapterId(loadedChapters[0].id);
          setContent(loadedChapters[0].content);
          setTitle(data.title || '');
          chaptersLoaded.current = true;
        }
      } else {
        navigate('/');
      }
    }, (error) => {
      console.error("Error fetching story:", error);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'stories', id, 'characters'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCharacters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const updatedChapters = chapters.map(ch => 
      ch.id === activeChapterId ? { ...ch, content: newContent } : ch
    );
    setChapters(updatedChapters);
    scheduleSave(title, updatedChapters);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    scheduleSave(newTitle, chapters);
  };

  const scheduleSave = (t: string, chaps: any[]) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!id || !user) return;
      try {
        const docRef = doc(db, 'stories', id);
        const totalWords = chaps.reduce((acc, ch) => acc + (ch.content ? ch.content.split(/\s+/).filter((w: string) => w.length > 0).length : 0), 0);
        await updateDoc(docRef, {
          title: t,
          chapters: chaps,
          content: chaps[0]?.content || '',
          wordCount: totalWords,
          updatedAt: Date.now()
        });
        setSaveStatus('saved');
      } catch (e) {
        console.error("Error saving:", e);
        setSaveStatus('error');
      }
    }, 1000);
  };

  const addChapter = () => {
    const newId = Date.now().toString();
    const newChapter = { id: newId, title: `Chapter ${chapters.length + 1}`, content: '' };
    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    setActiveChapterId(newId);
    setContent('');
    scheduleSave(title, updatedChapters);
  };

  const switchChapter = (chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      setActiveChapterId(chapterId);
      setContent(chapter.content);
    }
  };

  const renameChapter = (chapterId: string, currentTitle: string) => {
    setEditingChapterId(chapterId);
    setEditChapterTitle(currentTitle);
  };

  const saveChapterRename = (chapterId: string) => {
    if (editingChapterId === null) return; // Prevent double calls
    if (editChapterTitle.trim()) {
      const updatedChapters = chapters.map(ch => 
        ch.id === chapterId ? { ...ch, title: editChapterTitle.trim() } : ch
      );
      setChapters(updatedChapters);
      scheduleSave(title, updatedChapters);
    }
    setEditingChapterId(null);
  };

  const saveVersion = async () => {
    if (!id || !user) return;
    try {
      const docRef = doc(db, 'stories', id);
      await updateDoc(docRef, {
        versions: arrayUnion({
          content,
          timestamp: Date.now()
        }),
        updatedAt: Date.now()
      });
      showToast('Version saved successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save version.', 'error');
    }
  };

  const restoreVersion = (versionContent: string) => {
    setContent(versionContent);
    const updatedChapters = chapters.map(ch => 
      ch.id === activeChapterId ? { ...ch, content: versionContent } : ch
    );
    setChapters(updatedChapters);
    scheduleSave(title, updatedChapters);
    setShowHistory(false);
  };

  const toggleShare = async () => {
    if (!id || !user) return;
    try {
      const docRef = doc(db, 'stories', id);
      await updateDoc(docRef, {
        isShared: !story.isShared,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const insertFormatting = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);
    
    const updatedChapters = chapters.map(ch => 
      ch.id === activeChapterId ? { ...ch, content: newContent } : ch
    );
    setChapters(updatedChapters);
    scheduleSave(title, updatedChapters);
    
    // Reset selection after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  const askMuse = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || aiInput;
    if (!promptToUse.trim()) return;
    setIsGenerating(true);
    try {
      // Determine the type of suggestion based on the prompt
      let type: 'continuation' | 'improve' | 'dialogue' = 'continuation';
      const lowerPrompt = promptToUse.toLowerCase();
      if (lowerPrompt.includes('rewrite') || lowerPrompt.includes('improve') || lowerPrompt.includes('dramatic')) {
        type = 'improve';
      } else if (lowerPrompt.includes('dialogue') || lowerPrompt.includes('conversation')) {
        type = 'dialogue';
      }

      // Get the plain text content for context
      const plainTextContent = content.replace(/<[^>]*>/g, '').slice(-2000);
      const contextWithPrompt = `${plainTextContent}\n\nUser Request: ${promptToUse}`;
      
      const suggestion = await generateWritingSuggestion(contextWithPrompt, type, 'fantasy');
      setSuggestion(suggestion);
    } catch (e: any) {
      console.error("Muse Error:", e);
      setSuggestion(`<div class="ai-error">
        <p class="text-red-400">Unable to generate suggestion. Please try again.</p>
        <p class="text-[10px] text-slate-500 mt-2">${e.message || 'Unknown error'}</p>
      </div>`);
    }
    setIsGenerating(false);
    if (!overridePrompt) {
      setAiInput('');
    }
  };

  const insertSuggestion = () => {
    if (suggestion) {
      const newContent = content + '\n\n' + suggestion;
      setContent(newContent);
      setSuggestion(null);
      
      const updatedChapters = chapters.map(ch => 
        ch.id === activeChapterId ? { ...ch, content: newContent } : ch
      );
      setChapters(updatedChapters);
      scheduleSave(title, updatedChapters);
    }
  };

  const handleAddCollaborator = async () => {
    if (!id || !collabEmail.trim() || !user) return;
    try {
      // Create an invitation instead of directly adding
      await addDoc(collection(db, 'invitations'), {
        storyId: id,
        storyTitle: title,
        inviterEmail: user.email,
        inviterName: user.displayName || 'Author',
        inviteeEmail: collabEmail.trim(),
        status: 'pending',
        createdAt: Date.now()
      });
      
      setCollabEmail('');
      showToast('Invitation sent successfully!', 'success');
    } catch (error) {
      console.error("Error sending invitation:", error);
      showToast('Failed to send invitation.', 'error');
    }
  };

  if (!story) return <div className="flex h-screen items-center justify-center bg-bg-dark text-white">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-slate-100 font-sans overflow-hidden">
      {/* Top Nav */}
      {!isFullscreen && (
        <header className="flex items-center justify-between border-b border-border-dark px-6 py-3 bg-[#121118] z-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white hover:bg-primary-hover transition-colors">
              <Book size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={title} 
                  onChange={handleTitleChange}
                  className="bg-transparent text-white font-bold text-base outline-none focus:border-b focus:border-primary"
                />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-dark text-slate-400 uppercase tracking-wider">Draft</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                {saveStatus === 'saving' && <RefreshCw size={10} className="animate-spin" />}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? <span className="text-red-400">Save failed</span> : 'All changes saved'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-dark transition-colors text-sm text-slate-300">
                <History size={16} />
                <span>History</span>
              </button>
              <button onClick={() => setShowShare(true)} className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-2">
                <Share size={16} />
                Share
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Chapters) */}
        {!isFullscreen && (
          <aside className="w-64 border-r border-border-dark p-4 hidden xl:flex flex-col gap-4 bg-[#121118]">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chapters</div>
            <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
              {chapters.map((chap) => (
                <div 
                  key={chap.id} 
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeChapterId === chap.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-surface-dark text-slate-400'}`} 
                  onClick={() => {
                    if (editingChapterId !== chap.id) switchChapter(chap.id);
                  }}
                >
                  {editingChapterId === chap.id ? (
                    <input
                      type="text"
                      value={editChapterTitle}
                      onChange={(e) => setEditChapterTitle(e.target.value)}
                      onBlur={() => saveChapterRename(chap.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveChapterRename(chap.id);
                        if (e.key === 'Escape') setEditingChapterId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="bg-bg-dark text-white text-sm px-2 py-1 rounded border border-primary outline-none w-full"
                    />
                  ) : (
                    <>
                      <span className="text-sm truncate pr-2 flex-1">{chap.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); renameChapter(chap.id, chap.title); }} className="p-1 hover:text-white transition-colors" title="Rename Chapter">
                          <Edit3 size={12} />
                        </button>
                        {chapters.length > 1 && (
                          <button onClick={(e) => { 
                            e.stopPropagation(); 
                            setChapterToDelete(chap.id);
                          }} className="p-1 hover:text-red-400 transition-colors" title="Delete Chapter">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </nav>
            <button onClick={addChapter} className="mt-2 flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm transition-colors border border-dashed border-border-dark rounded-lg hover:border-slate-500">
              <Plus size={16} /> Add Chapter
            </button>
          </aside>
        )}

        {/* Center Editor */}
        <section className="flex-1 overflow-y-auto bg-bg-dark relative scroll-smooth p-12 flex flex-col">
          <div className="max-w-[800px] w-full mx-auto flex-1">
            <TiptapEditor 
              content={content} 
              onChange={handleContentChange} 
              bgColor={editorBgColor}
            />
          </div>
        </section>

        {/* Right AI Muse Sidebar */}
        {!isFullscreen && (
          <aside className="w-80 border-l border-border-dark bg-[#121118] flex flex-col z-10">
          <div className="p-4 border-b border-border-dark flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveRightTab('muse')}
                className={`flex items-center gap-2 font-bold text-xs transition-colors ${activeRightTab === 'muse' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Sparkles size={16} />
                MUSE
              </button>
              <button 
                onClick={() => setActiveRightTab('characters')}
                className={`flex items-center gap-2 font-bold text-xs transition-colors ${activeRightTab === 'characters' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Users size={16} />
                LORE
              </button>
            </div>
            <button className="text-slate-400 hover:text-slate-100">
              <Settings size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {activeRightTab === 'muse' ? (
              <>
                {/* Editor Background Color Selector */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Editor Mood</div>
                  <div className="flex gap-2">
                    {bgColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setEditorBgColor(color.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${editorBgColor === color.value ? 'border-primary scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => askMuse("Suggest the next 2 paragraphs")} className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-primary transition-all text-left group">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Edit3 size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200">Suggest Next</div>
                      <div className="text-[10px] text-slate-500">Generate 2 paragraphs</div>
                    </div>
                  </button>
                  <button onClick={() => askMuse("Rewrite the last paragraph to be more dramatic and dark")} className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-primary transition-all text-left group">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <Wand2 size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200">Fix Tone</div>
                      <div className="text-[10px] text-slate-500">Shift to Dramatic Noir</div>
                    </div>
                  </button>
                  <button onClick={() => askMuse("Analyze the main character's arc so far")} className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-primary transition-all text-left group">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <UserSearch size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200">Character Dev</div>
                      <div className="text-[10px] text-slate-500">Analyze arc</div>
                    </div>
                  </button>
                </div>

                {suggestion && (
                  <>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Live Suggestion</div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-[0_0_20px_rgba(50,17,212,0.15)]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold">AI GENERATED</span>
                        <button onClick={() => askMuse()} className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white">
                          <RefreshCw size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-4 font-serif">
                        {suggestion}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={insertSuggestion} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">Insert</button>
                        <button onClick={() => setSuggestion(null)} className="px-3 py-2 bg-surface-dark text-slate-300 rounded-lg text-xs font-bold hover:bg-border-dark transition-colors">Discard</button>
                      </div>
                    </div>
                  </>
                )}
                
                {isGenerating && (
                  <div className="p-4 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center">
                    <RefreshCw className="animate-spin text-primary" size={20} />
                    <span className="ml-2 text-sm text-slate-400">Muse is thinking...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Story Characters</div>
                {characters.length === 0 ? (
                  <div className="p-8 text-center bg-surface-dark rounded-xl border border-border-dark">
                    <Ghost size={32} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-xs text-slate-500">No characters defined yet. Visit LoreForge to create some!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {characters.map(char => (
                      <div key={char.id} className="p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${char.imageUrl})` }}></div>
                          <div>
                            <div className="text-xs font-bold text-white">{char.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{char.role}</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">"{char.description}"</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/explore" state={{ tab: 'loreforge' }} className="block w-full py-2 text-center text-xs font-bold text-primary hover:underline">Open LoreForge AI</Link>
              </div>
            )}
          </div>

          {/* AI Input Box */}
          {activeRightTab === 'muse' && (
            <div className="p-4 border-t border-border-dark bg-surface-dark">
              <div className="relative">
                <textarea 
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askMuse(); } }}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl text-xs text-white focus:ring-1 focus:ring-primary focus:border-primary p-3 pr-10 resize-none outline-none" 
                  placeholder="Ask Muse for anything..." 
                  rows={2}
                />
                <button onClick={() => askMuse()} disabled={isGenerating || !aiInput.trim()} className="absolute right-3 bottom-3 text-primary disabled:text-slate-600 hover:text-primary-hover transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </aside>
        )}
      </main>

      {/* Bottom Status Bar */}
      {!isFullscreen && (
        <footer className="h-8 border-t border-border-dark bg-[#121118] px-4 flex items-center justify-between text-[10px] text-slate-400 font-medium z-20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected</span>
            <span>Words: {chapters.reduce((acc, ch) => acc + (ch.content ? ch.content.split(/\s+/).filter((w: string) => w.length > 0).length : 0), 0)}</span>
            <span>Chars: {content.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-white transition-colors">Spellcheck: ON</button>
            <button className="hover:text-white transition-colors">English (US)</button>
          </div>
        </footer>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-border-dark rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border-dark flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><History size={20} /> Version History</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 border-b border-border-dark flex justify-between items-center bg-bg-dark">
              <span className="text-sm text-slate-400">Save your current progress as a named version.</span>
              <button onClick={saveVersion} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors">Save Current Version</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {story?.versions?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No saved versions yet.</p>
              ) : (
                story?.versions?.map((v: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-border-dark bg-bg-dark flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Version {story.versions.length - i}</span>
                      <span className="text-xs text-slate-500">{new Date(v.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 font-serif">{v.content}</p>
                    <div className="flex justify-end">
                      <button onClick={() => restoreVersion(v.content)} className="text-xs font-bold text-primary hover:text-primary-hover">Restore this version</button>
                    </div>
                  </div>
                )).reverse()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-border-dark rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border-dark flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><Share size={20} /> Share Story</h3>
              <button onClick={() => setShowShare(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Public Link</h4>
                  <p className="text-xs text-slate-400">Allow anyone with the link to read this story.</p>
                </div>
                <button 
                  onClick={toggleShare}
                  className={`w-12 h-6 rounded-full transition-colors relative ${story?.isShared ? 'bg-primary' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${story?.isShared ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              
              {story?.isShared && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Share Link</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/editor/${story._id}`}
                      className="flex-1 bg-bg-dark border border-border-dark rounded-lg p-2 text-sm text-slate-300 outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/editor/${story._id}`);
                        showToast('Link copied!', 'success');
                      }}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border-dark">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Users size={16} /> Collaborators</h4>
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="email" 
                    placeholder="Collaborator email..." 
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                    className="flex-1 bg-bg-dark border border-border-dark rounded-lg p-2 text-sm text-slate-300 outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleAddCollaborator}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">A</div>
                    <span>{story?.authorName || 'Author'} (Owner)</span>
                  </div>
                  {story?.collaborators?.map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">C</div>
                      <span>Collaborator {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            {toast.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
          </div>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Delete Chapter Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-border-dark rounded-2xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold text-lg mb-2">Delete Chapter?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone. Are you sure you want to delete this chapter?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setChapterToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-surface-dark transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const updatedChapters = chapters.filter(c => c.id !== chapterToDelete);
                  setChapters(updatedChapters);
                  if (activeChapterId === chapterToDelete) {
                    switchChapter(updatedChapters[0].id);
                  }
                  scheduleSave(title, updatedChapters);
                  setChapterToDelete(null);
                  showToast('Chapter deleted', 'success');
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
