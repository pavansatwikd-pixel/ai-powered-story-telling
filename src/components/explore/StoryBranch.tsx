import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Users, LayoutGrid, List, Sparkles, GitBranch, Settings, Map, ZoomIn, ZoomOut, Maximize, ChevronRight, X, Trash2 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc, getDocs, arrayUnion, or } from 'firebase/firestore';
import { motion } from 'motion/react';
import { generatePlotSuggestion } from '../../services/aiService';

interface Story {
  id: string;
  title: string;
  authorId: string;
  collaborators?: string[];
}

interface StoryNode {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  type: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}

export default function StoryBranch() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabEmail, setCollabEmail] = useState('');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [editingNode, setEditingNode] = useState<StoryNode | null>(null);
  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeContent, setEditNodeContent] = useState('');
  const [activeTimeline, setActiveTimeline] = useState('main');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to stories where user is author OR collaborator
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

    const q = query(collection(db, 'stories', activeStoryId, 'nodes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedNodes: StoryNode[] = [];
      snapshot.forEach((doc) => {
        loadedNodes.push({ id: doc.id, ...doc.data() } as StoryNode);
      });
      setNodes(loadedNodes);
    });

    return () => unsubscribe();
  }, [activeStoryId]);

  const activeStory = stories.find(s => s.id === activeStoryId);

  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);

  const handleAddNode = async () => {
    if (!activeStoryId || !newNodeTitle.trim() || !auth.currentUser) return;
    
    try {
      const parentNode = nodes.find(n => n.id === selectedParentId);
      const startX = parentNode ? parentNode.x + 250 : 100;
      const startY = parentNode ? parentNode.y : 100;

      const nodeData: any = {
        title: newNodeTitle,
        content: '',
        x: startX + (Math.random() * 50 - 25),
        y: startY + (Math.random() * 100 - 50),
        type: activeTimeline === 'main' ? 'branch' : activeTimeline,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        createdAt: Date.now()
      };
      
      if (selectedParentId) {
        nodeData.parentId = selectedParentId;
      }

      await addDoc(collection(db, 'stories', activeStoryId, 'nodes'), nodeData);
      setNewNodeTitle('');
      setIsAddingNode(false);
      setSelectedParentId(undefined);
      showToast('Branch created successfully!', 'success');
    } catch (error: any) {
      console.error("Error adding node:", error);
      showToast(error.message || 'Failed to create branch.', 'error');
    }
  };

  const handleGenerateAISuggestion = async () => {
    if (!activeStoryId || !auth.currentUser) return;
    
    // Get context from existing nodes
    const contextNodes = nodes.slice(-5).map(n => `${n.title}: ${n.content}`).join('\n');
    
    setIsGeneratingAI(true);
    try {
      const result = await generatePlotSuggestion(contextNodes, 'fantasy');
      
      const parentNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;
      const startX = parentNode ? parentNode.x + 250 : 100;
      const startY = parentNode ? parentNode.y + 150 : 100;

      const nodeData: any = {
        title: result.title,
        content: result.content,
        x: startX + (Math.random() * 50 - 25),
        y: startY + (Math.random() * 100 - 50),
        type: 'ai',
        authorId: auth.currentUser.uid,
        authorName: 'AI Assistant',
        createdAt: Date.now()
      };
      
      if (parentNode) {
        nodeData.parentId = parentNode.id;
      }

      await addDoc(collection(db, 'stories', activeStoryId, 'nodes'), nodeData);
      showToast('AI suggestion added!', 'success');
      setActiveTimeline('ai');
    } catch (error: any) {
      console.error("Error generating AI suggestion:", error);
      showToast(error.message || 'Failed to generate AI suggestion.', 'error');
    }
    setIsGeneratingAI(false);
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!activeStoryId) return;
    try {
      await deleteDoc(doc(db, 'stories', activeStoryId, 'nodes', nodeId));
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  };

  const handleDragEnd = async (nodeId: string, info: any) => {
    if (!activeStoryId) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      await updateDoc(doc(db, 'stories', activeStoryId, 'nodes', nodeId), {
        x: node.x + info.offset.x,
        y: node.y + info.offset.y
      });
    } catch (error) {
      console.error("Error updating node position:", error);
    }
  };

  const handleSaveNodeEdit = async () => {
    if (!activeStoryId || !editingNode) return;
    try {
      await updateDoc(doc(db, 'stories', activeStoryId, 'nodes', editingNode.id), {
        title: editNodeTitle,
        content: editNodeContent
      });
      setEditingNode(null);
      showToast('Node updated successfully', 'success');
    } catch (error) {
      console.error("Error updating node:", error);
      showToast('Failed to update node', 'error');
    }
  };

  const handleAddCollaborator = async () => {
    if (!activeStoryId || !collabEmail.trim()) return;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', collabEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
        
        await updateDoc(doc(db, 'stories', activeStoryId), {
          collaborators: arrayUnion(userId)
        });
        setCollabEmail('');
        setShowCollabModal(false);
        showToast('Collaborator added successfully!', 'success');
      } else {
        showToast('User not found with that email.', 'error');
      }
    } catch (error) {
      console.error("Error adding collaborator:", error);
      showToast('Failed to add collaborator.', 'error');
    }
  };

  const filteredNodes = nodes.filter(node => {
    const isMain = node.type === 'branch' || node.type === 'main' || !node.type;
    if (activeTimeline === 'main') return isMain;
    if (activeTimeline === 'ai') return isMain || node.type === 'ai';
    if (activeTimeline === 'draft') return isMain || node.type === 'draft';
    if (activeTimeline === 'alternate') return isMain || node.type === 'alternate';
    return true;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0A0B10] text-gray-300 font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0F111A] flex flex-col shrink-0">
        <div className="p-5">
          <div className="text-xs font-semibold text-gray-500 tracking-wider mb-2">ACTIVE PROJECT</div>
          <select 
            className="w-full bg-[#1A1C23] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={activeStoryId || ''}
            onChange={(e) => setActiveStoryId(e.target.value)}
          >
            {stories.map(story => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
            {stories.length === 0 && <option value="">No projects found</option>}
          </select>
        </div>

        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-gray-500 tracking-wider mb-3 px-2">TIMELINES</div>
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTimeline('main')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTimeline === 'main' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <Sparkles size={16} />
              Main Narrative
            </button>
            <button 
              onClick={() => setActiveTimeline('draft')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTimeline === 'draft' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <List size={16} />
              Drafts & Ideas
            </button>
            <button 
              onClick={() => setActiveTimeline('alternate')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTimeline === 'alternate' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <GitBranch size={16} />
              Alternate Realities
            </button>
            <button 
              onClick={() => setActiveTimeline('ai')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${activeTimeline === 'ai' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <Settings size={16} />
                AI Suggestions
              </div>
              <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {nodes.filter(n => n.type === 'ai').length}
              </span>
            </button>
          </div>
        </div>

        <div className="px-3 py-4 mt-4">
          <div className="text-xs font-semibold text-gray-500 tracking-wider mb-3 px-2">CHARACTERS</div>
          <div className="flex items-center gap-1 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-[#0F111A] -mr-2 z-30"></div>
            <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-[#0F111A] -mr-2 z-20"></div>
            <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-[#0F111A] -mr-2 z-10"></div>
            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#0F111A] flex items-center justify-center text-xs font-medium text-white z-0">+5</div>
          </div>
        </div>

        <div className="mt-auto p-4">
          <button 
            onClick={() => setShowCollabModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-white"
          >
            <Users size={16} />
            Collaborators ({activeStory?.collaborators?.length || 0})
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0B10]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Projects</span>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">{activeStory?.title || 'Select a project'}</span>
            {activeStory && (
              <>
                <span className="text-gray-600 mx-2">|</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  activeTimeline === 'main' ? 'text-indigo-400' :
                  activeTimeline === 'draft' ? 'text-gray-400' :
                  activeTimeline === 'alternate' ? 'text-emerald-400' :
                  'text-purple-400'
                }`}>
                  {activeTimeline === 'main' ? 'Main Narrative' : 
                   activeTimeline === 'draft' ? 'Drafts & Ideas' : 
                   activeTimeline === 'alternate' ? 'Alternate Realities' : 
                   'AI Suggestions'} View
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search nodes or characters..." 
                className="w-64 bg-[#1A1C23] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {activeTimeline === 'ai' && (
              <button 
                onClick={handleGenerateAISuggestion}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Sparkles size={16} />
                {isGeneratingAI ? 'Generating...' : 'Generate AI Branch'}
              </button>
            )}
            <button 
              onClick={() => setIsAddingNode(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New Branch
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0A0B10] overflow-auto" ref={canvasRef} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          
          {/* Legend */}
          <div className="fixed top-24 left-72 flex items-center gap-4 bg-[#1A1C23] border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium z-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-gray-300">MAIN</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-gray-400">DRAFT</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-400">ALT</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border border-purple-500 border-dashed"></div>
              <span className="text-gray-400">AI</span>
            </div>
          </div>

          {/* Nodes */}
          <div className="absolute inset-0 min-w-[2000px] min-h-[2000px]">
            {/* Draw lines between nodes if parentId exists */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {filteredNodes.map(node => {
                if (node.parentId) {
                  const parent = filteredNodes.find(n => n.id === node.parentId);
                  if (parent) {
                    return (
                      <path 
                        key={`line-${node.id}`}
                        d={`M ${parent.x + 96} ${parent.y + 50} C ${parent.x + 150} ${parent.y + 50}, ${node.x - 50} ${node.y + 50}, ${node.x} ${node.y + 50}`} 
                        stroke="#4F46E5" 
                        strokeWidth="2" 
                        fill="none" 
                        opacity="0.5"
                      />
                    );
                  }
                }
                return null;
              })}
            </svg>

            {filteredNodes.map(node => (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                onDragEnd={(e, info) => handleDragEnd(node.id, info)}
                initial={{ x: node.x, y: node.y }}
                animate={{ x: node.x, y: node.y }}
                onClick={() => {
                  setEditingNode(node);
                  setEditNodeTitle(node.title);
                  setEditNodeContent(node.content || '');
                }}
                className={`absolute w-48 bg-[#12131A] border ${
                  node.type === 'ai' ? 'border-purple-500/50 border-dashed' : 
                  node.type === 'draft' ? 'border-gray-500/50' :
                  node.type === 'alternate' ? 'border-emerald-500/50' :
                  'border-indigo-500'
                } rounded-xl p-4 shadow-lg z-10 cursor-move group hover:ring-2 hover:ring-indigo-500/50 transition-shadow`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-[10px] font-bold ${
                    node.type === 'ai' ? 'text-purple-400' : 
                    node.type === 'draft' ? 'text-gray-400' :
                    node.type === 'alternate' ? 'text-emerald-400' :
                    'text-indigo-500'
                  } tracking-wider uppercase`}>
                    {node.type === 'ai' ? 'AI Suggestion' : 
                     node.type === 'draft' ? 'Draft' :
                     node.type === 'alternate' ? 'Alternate' :
                     'Branch'}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-sm font-bold text-white mb-3">{node.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {node.type === 'ai' ? <Sparkles size={12} /> : <Users size={12} />}
                  {node.authorName}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add Node Modal */}
          {isAddingNode && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="bg-[#12131A] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Create New Branch</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., The Secret Alliance" 
                      value={newNodeTitle}
                      onChange={(e) => setNewNodeTitle(e.target.value)}
                      className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Connect to Parent (Optional)</label>
                    <select 
                      value={selectedParentId || ''}
                      onChange={(e) => setSelectedParentId(e.target.value || undefined)}
                      className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">No Parent (Root Node)</option>
                      {filteredNodes.map(node => (
                        <option key={node.id} value={node.id}>{node.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => { setIsAddingNode(false); setSelectedParentId(undefined); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleAddNode} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">Create Branch</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Node Modal */}
          {editingNode && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="bg-[#12131A] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Edit Branch</h2>
                  <button onClick={() => setEditingNode(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch Title</label>
                    <input 
                      type="text" 
                      value={editNodeTitle}
                      onChange={(e) => setEditNodeTitle(e.target.value)}
                      className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col min-h-[300px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Content</label>
                    <textarea 
                      value={editNodeContent}
                      onChange={(e) => setEditNodeContent(e.target.value)}
                      className="w-full flex-1 bg-[#1A1C23] border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500 resize-none font-serif"
                      placeholder="Write the content for this branch..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                  <button onClick={() => setEditingNode(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleSaveNodeEdit} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Collaborator Modal */}
          {showCollabModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="bg-[#12131A] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Add Collaborator</h2>
                  <button onClick={() => setShowCollabModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <p className="text-sm text-gray-400 mb-4">Enter the email address of the user you want to invite to this project.</p>
                <input 
                  type="email" 
                  placeholder="User Email" 
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  className="w-full bg-[#1A1C23] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCollabModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleAddCollaborator} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">Invite</button>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-20">
            <div className="bg-[#1A1C23] border border-white/10 rounded-lg overflow-hidden flex flex-col">
              <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10">
                <ZoomIn size={18} />
              </button>
              <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10">
                <ZoomOut size={18} />
              </button>
              <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Maximize size={18} />
              </button>
            </div>
            <button className="p-2.5 bg-[#1A1C23] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Map size={18} />
            </button>
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
