import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ArrowLeft, Send, Sparkles, Loader2, BarChart2, LayoutGrid, Library, ChevronRight, ChevronLeft, FolderPlus, Move, Lock, Globe, Trash2, Edit2, AlertTriangle, Check, Calendar, History } from 'lucide-react';
import { Jar, StarNote, AppView, Language } from './types';
import { MORANDI_COLORS, MAX_NOTE_LENGTH, TRANSLATIONS } from './constants';
import { loadJars, saveJars } from './services/storageService';
import { generateReflection, suggestJarShape } from './services/geminiService';
import { JarVisual } from './components/JarVisual';
import { StarVisual } from './components/StarVisual';

// --- HELPER HOOK FOR LONG PRESS ---
const useLongPress = (callback: () => void, ms = 500) => {
    const [startLongPress, setStartLongPress] = useState(false);
    const timerId = useRef<any>();

    useEffect(() => {
        if (startLongPress) {
            timerId.current = setTimeout(callback, ms);
        } else {
            clearTimeout(timerId.current);
        }
        return () => clearTimeout(timerId.current);
    }, [startLongPress, callback, ms]);

    return {
        onMouseDown: () => setStartLongPress(true),
        onMouseUp: () => setStartLongPress(false),
        onMouseLeave: () => setStartLongPress(false),
        onTouchStart: () => setStartLongPress(true),
        onTouchEnd: () => setStartLongPress(false),
    };
};

interface JarItemProps {
  jar: Jar;
  isShelfMode: boolean;
  draggedJarId: string | null;
  itemsPerPage: number;
  setContextMenuJar: (jar: Jar | null) => void;
  onDragStart: (e: React.DragEvent, jarId: string) => void;
  handleOpenJar: (id: string) => void;
}

const JarItem: React.FC<JarItemProps> = ({ 
  jar, 
  isShelfMode,
  draggedJarId,
  itemsPerPage,
  setContextMenuJar,
  onDragStart,
  handleOpenJar
}) => {
    const longPressProps = useLongPress(() => {
        // Mobile Long Press Logic
        setContextMenuJar(jar);
    }, 600);

    return (
      <div 
          {...longPressProps}
          draggable 
          onDragStart={(e) => onDragStart(e, jar.id)}
          className="cursor-pointer relative group"
      >
          <div className={`transform transition-transform hover:-translate-y-2 ${draggedJarId === jar.id ? 'opacity-50' : ''}`}>
               <JarVisual 
                  stars={jar.stars} 
                  label={jar.name} 
                  themeColor={jar.themeColor}
                  shape={jar.shape}
                  onClick={() => handleOpenJar(jar.id)}
                  size={isShelfMode ? 'sm' : (itemsPerPage === 1 ? 'lg' : 'md')} 
              />
          </div>
      </div>
    );
};

function App() {
  const [jars, setJars] = useState<Jar[]>([]);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [activeJarId, setActiveJarId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en'); 
  
  // Navigation & Shelf
  const [isShelfMode, setIsShelfMode] = useState(false); 
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [shelves, setShelves] = useState<string[]>([]);
  
  // Modals
  const [isManagingShelves, setIsManagingShelves] = useState(false); 
  const [contextMenuJar, setContextMenuJar] = useState<Jar | null>(null); // For Mobile Long Press
  const [jarToDelete, setJarToDelete] = useState<Jar | null>(null);
  const [shelfToDelete, setShelfToDelete] = useState<string | null>(null);
  const [editingShelf, setEditingShelf] = useState<{old: string, new: string} | null>(null);
  const [unlockNotification, setUnlockNotification] = useState<{title: string, msg: string} | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Edit Jar Name State (In Detail View)
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempJarName, setTempJarName] = useState('');

  // Creation
  const [isCreatingJar, setIsCreatingJar] = useState(false);
  const [newJarName, setNewJarName] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  
  // Star Folding
  const [isFoldingStar, setIsFoldingStar] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [foldingStage, setFoldingStage] = useState<'writing' | 'animating' | 'dropping'>('writing');
  const [tempStarColor, setTempStarColor] = useState(MORANDI_COLORS[0]);

  // Reflection
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionText, setReflectionText] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);

  // Drag and Drop State
  const [draggedJarId, setDraggedJarId] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  // --- INITIALIZATION & EFFECTS ---

  useEffect(() => {
    const loaded = loadJars();
    const sanitizedJars = loaded.map(j => ({...j, shelf: j.shelf || 'My Collection'}));
    setJars(sanitizedJars);

    const existingShelves = Array.from(new Set(sanitizedJars.map(j => j.shelf || 'My Collection')));
    if (existingShelves.length === 0) existingShelves.push('My Collection');
    setShelves(existingShelves);
  }, []);

  useEffect(() => {
    saveJars(jars);
  }, [jars]);

  // Unlock Notifications Logic
  useEffect(() => {
    const jarCount = jars.length;
    // We use sessionStorage to ensure we don't annoy the user on every reload
    const hasSeenStats = sessionStorage.getItem('seenStatsUnlock');
    const hasSeenShelf = sessionStorage.getItem('seenShelfUnlock');

    if (jarCount === 10 && !hasSeenStats) {
        setUnlockNotification({ title: t.unlockedStatsTitle, msg: t.unlockedStatsMsg });
        sessionStorage.setItem('seenStatsUnlock', 'true');
    }
    
    if (jarCount === 15 && !hasSeenShelf) {
        setUnlockNotification({ title: t.unlockedShelfTitle, msg: "You have collected 15 jars. Shelf mode unlocked!" });
        sessionStorage.setItem('seenShelfUnlock', 'true');
    }
  }, [jars.length, t]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setItemsPerPage(1); 
      else if (w < 1024) setItemsPerPage(3); 
      else setItemsPerPage(4); 
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeJar = jars.find(j => j.id === activeJarId);
  const totalStars = jars.reduce((acc, jar) => acc + jar.stars.length, 0);

  // RULES: 
  // Stats unlock at 10 jars. 
  // Shelf mode unlocks at 15 jars.
  const isStatsUnlocked = jars.length >= 10;
  const isShelfUnlocked = jars.length >= 15;

  // --- ACTIONS ---

  const handleToggleLanguage = () => {
      setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleCreateJar = async () => {
    if (!newJarName.trim()) return;
    setCreatingLoading(true);

    const suggestedShape = await suggestJarShape(newJarName);
    const color = MORANDI_COLORS[Math.floor(Math.random() * MORANDI_COLORS.length)];
    
    const newJar: Jar = {
      id: crypto.randomUUID(),
      name: newJarName,
      createdAt: new Date().toISOString(),
      stars: [],
      themeColor: color,
      shape: suggestedShape,
      shelf: 'My Collection'
    };

    setJars(prev => [...prev, newJar]);
    if (!shelves.includes('My Collection')) setShelves(prev => [...prev, 'My Collection']);

    setNewJarName('');
    setIsCreatingJar(false);
    setCreatingLoading(false);
    setTimeout(() => {
        const totalPages = Math.ceil((jars.length + 1) / itemsPerPage);
        setCurrentPage(totalPages - 1);
    }, 100);
  };

  // --- SHELF MANAGEMENT ---

  const handleCreateShelf = () => {
      if (!newShelfName.trim()) return;
      const cleanName = newShelfName.trim();
      if (!shelves.includes(cleanName)) {
          setShelves(prev => [...prev, cleanName]);
      }
      setNewShelfName('');
      setIsManagingShelves(false);
  };

  const handleMoveJar = (jarId: string, targetShelf: string) => {
      setJars(prev => prev.map(j => j.id === jarId ? { ...j, shelf: targetShelf } : j));
      setContextMenuJar(null); // Close mobile menu if open
  };

  const handleDeleteJar = () => {
      if (!jarToDelete) return;
      setJars(prev => prev.filter(j => j.id !== jarToDelete.id));
      setJarToDelete(null);
      setContextMenuJar(null);
      if (activeJarId === jarToDelete.id) {
          handleBackToDashboard();
      }
  };

  const handleSaveJarName = () => {
      if (!activeJar || !tempJarName.trim()) return;
      setJars(prev => prev.map(j => j.id === activeJar.id ? { ...j, name: tempJarName.trim() } : j));
      setIsEditingName(false);
  };

  const handleRenameShelf = () => {
      if (!editingShelf || !editingShelf.new.trim()) return;
      // Update shelf list
      setShelves(prev => prev.map(s => s === editingShelf.old ? editingShelf.new : s));
      // Update jars on that shelf
      setJars(prev => prev.map(j => j.shelf === editingShelf.old ? { ...j, shelf: editingShelf.new } : j));
      setEditingShelf(null);
  };

  const handleDeleteShelf = () => {
      if (!shelfToDelete) return;
      setShelves(prev => prev.filter(s => s !== shelfToDelete));
      setJars(prev => prev.filter(j => j.shelf !== shelfToDelete));
      setShelfToDelete(null);
  };

  // --- DRAG AND DROP (Desktop) ---

  const onDragStart = (e: React.DragEvent, jarId: string) => {
      setDraggedJarId(jarId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetShelf: string) => {
      e.preventDefault();
      if (draggedJarId) {
          handleMoveJar(draggedJarId, targetShelf);
          setDraggedJarId(null);
      }
  };

  // --- INTERACTIONS ---

  const handleOpenJar = (id: string) => {
    setActiveJarId(id);
    setView(AppView.JAR_DETAIL);
    setReflectionText(null);
    setIsEditingName(false);
    setShowHistoryModal(false);
  };

  const handleBackToDashboard = () => {
    setView(AppView.DASHBOARD);
    setActiveJarId(null);
    setIsFoldingStar(false);
    setFoldingStage('writing');
    setNewNoteContent('');
    setShowHistoryModal(false);
  };

  const nextPage = () => setCurrentPage(p => (p + 1) % Math.ceil(jars.length / itemsPerPage));
  const prevPage = () => setCurrentPage(p => (p - 1 + Math.ceil(jars.length / itemsPerPage)) % Math.ceil(jars.length / itemsPerPage));

  // --- Star Logic ---
  const startFolding = () => {
    if (!activeJar) return;
    setIsFoldingStar(true);
    setFoldingStage('writing');
    setTempStarColor(MORANDI_COLORS[Math.floor(Math.random() * MORANDI_COLORS.length)]); 
  };

  const processFold = () => {
    setFoldingStage('animating');
    setTimeout(() => {
        setFoldingStage('dropping');
        setTimeout(() => {
            if (!activeJar) return;
            const count = activeJar.stars.length;
            const finalY = Math.max(0, Math.min(85, (count * 1.5) + (Math.random() * 5))); 
            const newStar: StarNote = {
                id: crypto.randomUUID(),
                content: newNoteContent,
                date: new Date().toISOString(),
                color: tempStarColor,
                rotation: Math.random() * 360,
                x: Math.random() * 80 + 10, 
                y: finalY 
            };
            setJars(prev => prev.map(j => j.id === activeJar.id ? { ...j, stars: [...j.stars, newStar] } : j));
            setIsFoldingStar(false);
            setNewNoteContent('');
            setFoldingStage('writing');
        }, 1500); 
    }, 1800); 
  };

  const handleReflect = async () => {
    if (!activeJar) return;
    setIsReflecting(true);
    setReflectionLoading(true);
    const text = await generateReflection(activeJar, language);
    setReflectionText(text);
    setReflectionLoading(false);
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="min-h-screen w-full flex flex-col bg-morandi-bg overflow-hidden relative font-sans text-morandi-text">
      <header className="px-8 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div>
            <h1 className="text-4xl font-bold text-morandi-charcoal tracking-wide">{t.appTitle}</h1>
            <p className="text-morandi-text font-medium text-lg mt-1">{t.appSubtitle}</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
             
             {/* Stats Button - HIDDEN UNTIL UNLOCKED */}
             {isStatsUnlocked && (
                <button 
                    onClick={() => setView(AppView.STATS)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all bg-white text-morandi-charcoal hover:bg-morandi-slate hover:text-white"
                 >
                    <BarChart2 size={18} /> {t.stats}
                 </button>
             )}

             {/* Shelf Button - HIDDEN UNTIL UNLOCKED */}
             {isShelfUnlocked && (
                 <button 
                    onClick={() => setIsShelfMode(!isShelfMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all ${
                        isShelfMode ? 'bg-morandi-charcoal text-white' : 'bg-white text-morandi-charcoal'
                    }`}
                 >
                    {isShelfMode ? <LayoutGrid size={18}/> : <Library size={18}/>} 
                    {isShelfMode ? t.carouselView : t.shelfMode}
                 </button>
             )}

             <button onClick={handleToggleLanguage} className="p-2 rounded-full bg-white text-morandi-charcoal hover:bg-morandi-bg transition-colors shadow-sm">
                 <Globe size={20} />
             </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center w-full relative">
      {jars.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center opacity-60">
            <div className="w-32 h-32 rounded-full bg-morandi-dusty/20 flex items-center justify-center mb-4">
                <Sparkles className="w-12 h-12 text-morandi-slate" />
            </div>
            <p className="text-2xl font-medium text-morandi-text">{t.noJars}</p>
        </div>
      ) : (
        isShelfMode && isShelfUnlocked ? (
            // === SHELF MODE ===
            <div className="w-full h-full overflow-y-auto pb-32 px-4">
                <div className="max-w-7xl mx-auto py-8">
                     <div className="flex justify-end mb-6">
                        <button 
                            onClick={() => setIsManagingShelves(true)}
                            className="flex items-center gap-2 text-morandi-charcoal hover:bg-white px-4 py-2 rounded-full transition-colors font-bold"
                        >
                            <FolderPlus size={18} /> {t.newShelf}
                        </button>
                     </div>

                     {shelves.map((shelfName) => {
                         const shelfJars = jars.filter(j => j.shelf === shelfName);
                         return (
                            <div 
                                key={shelfName} 
                                className="mb-12"
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, shelfName)}
                            >
                                <div className="flex items-center justify-between mb-2 px-4 border-l-4 border-morandi-wood">
                                    <h3 className="text-2xl font-bold text-morandi-charcoal">{shelfName}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingShelf({old: shelfName, new: shelfName})} className="p-2 text-gray-400 hover:text-morandi-charcoal"><Edit2 size={16}/></button>
                                        <button onClick={() => setShelfToDelete(shelfName)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="wood-shelf-container">
                                    <div className="wood-shelf px-8 py-8 flex flex-wrap gap-8 items-end min-h-[260px]">
                                        {shelfJars.length === 0 && (
                                            <div className="w-full text-center text-white/40 italic py-10 pointer-events-none">{t.emptyShelf}</div>
                                        )}
                                        {shelfJars.map(jar => (
                                            <JarItem 
                                                key={jar.id} 
                                                jar={jar} 
                                                isShelfMode={true}
                                                draggedJarId={draggedJarId}
                                                itemsPerPage={itemsPerPage}
                                                setContextMenuJar={setContextMenuJar}
                                                onDragStart={onDragStart}
                                                handleOpenJar={handleOpenJar}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                         );
                     })}
                </div>
            </div>
        ) : (
            // === PAGINATION / CAROUSEL MODE ===
            <div className="w-full max-w-7xl mx-auto flex items-center justify-center gap-4 md:gap-8 px-4 h-full">
                {jars.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((jar) => (
                    <div key={jar.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                         <JarItem 
                             jar={jar} 
                             isShelfMode={false} 
                             draggedJarId={draggedJarId}
                             itemsPerPage={itemsPerPage}
                             setContextMenuJar={setContextMenuJar}
                             onDragStart={onDragStart}
                             handleOpenJar={handleOpenJar}
                         />
                    </div>
                ))}
            </div>
        )
      )}
      </div>
      
      {(!isShelfMode || !isShelfUnlocked) && jars.length > itemsPerPage && (
        <>
            <button onClick={prevPage} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/50 hover:bg-white shadow-lg text-morandi-charcoal transition-all hover:scale-110 z-20">
                <ChevronLeft size={32} />
            </button>
            <button onClick={nextPage} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/50 hover:bg-white shadow-lg text-morandi-charcoal transition-all hover:scale-110 z-20">
                <ChevronRight size={32} />
            </button>
        </>
      )}

      {/* FAB */}
      <button 
        onClick={() => setIsCreatingJar(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-morandi-charcoal text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-morandi-slate transition-colors z-50 hover:scale-110 duration-300"
      >
        <Plus size={32} />
      </button>

      {/* --- MODALS --- */}

      {/* 1. New Jar */}
      {isCreatingJar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-2 border-morandi-bg animate-float font-sans">
            <h2 className="text-3xl font-bold text-morandi-charcoal mb-6">{t.startNewJar}</h2>
            <div className="mb-6">
                <label className="block text-sm font-bold text-morandi-text mb-2 uppercase tracking-wider">{t.habitNameLabel}</label>
                <input autoFocus type="text" value={newJarName} onChange={(e) => setNewJarName(e.target.value)} placeholder={t.habitPlaceholder} className="w-full text-2xl font-medium border-b-2 border-morandi-sage focus:border-morandi-charcoal outline-none py-2 bg-transparent placeholder-gray-300 transition-colors" />
                <p className="text-sm text-morandi-slate mt-2 flex items-center gap-1"><Sparkles size={14}/> {t.aiDesigning}</p>
            </div>
            <div className="flex justify-end gap-4">
                <button onClick={() => setIsCreatingJar(false)} className="px-6 py-2 text-morandi-text hover:bg-morandi-bg rounded-full transition-colors">{t.cancel}</button>
                <button onClick={handleCreateJar} disabled={!newJarName.trim() || creatingLoading} className="px-8 py-2 bg-morandi-charcoal text-white rounded-full hover:bg-morandi-slate disabled:opacity-50 transition-all shadow-md flex items-center gap-2">
                    {creatingLoading ? <Loader2 className="animate-spin w-4 h-4" /> : t.create}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. New Shelf */}
      {isManagingShelves && (
         <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">{t.newShelf}</h3>
                <input type="text" value={newShelfName} onChange={e => setNewShelfName(e.target.value)} placeholder={t.shelfName} className="w-full border-b border-gray-300 p-2 mb-6 outline-none focus:border-morandi-charcoal" />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsManagingShelves(false)} className="px-4 py-2 text-gray-500">{t.cancel}</button>
                    <button onClick={handleCreateShelf} className="px-4 py-2 bg-morandi-charcoal text-white rounded-lg">{t.add}</button>
                </div>
            </div>
         </div>
      )}

      {/* 3. Mobile Context Menu (Long Press) - NO RENAME HERE */}
      {contextMenuJar && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setContextMenuJar(null)}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-center">{contextMenuJar.name}</h3>
                <div className="flex flex-col gap-2">
                    {/* Move to... submenu */}
                    <div className="py-2">
                        <p className="text-xs text-center text-gray-400 mb-2 uppercase">{t.moveToShelf}</p>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                            {shelves.map(s => (
                                <button key={s} onClick={() => handleMoveJar(contextMenuJar.id, s)} className={`text-sm py-2 px-4 rounded-lg text-left ${contextMenuJar.shelf === s ? 'bg-morandi-slate text-white' : 'hover:bg-gray-50'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setJarToDelete(contextMenuJar)} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2"><Trash2 size={16}/> {t.delete}</button>
                </div>
            </div>
          </div>
      )}

      {/* 4. Delete Confirmation (Strict) */}
      {(jarToDelete || shelfToDelete) && (
          <div className="fixed inset-0 bg-red-900/20 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-red-100">
                  <div className="flex justify-center mb-4 text-red-500"><AlertTriangle size={48} /></div>
                  <h3 className="text-2xl font-bold text-center text-morandi-charcoal mb-2">{t.confirmDelete}</h3>
                  <p className="text-center text-red-500 font-bold mb-6">{t.irreversible}</p>
                  
                  {shelfToDelete && <p className="text-center text-sm text-gray-500 mb-6">Deleting a shelf will delete all jars within it.</p>}

                  <div className="flex gap-4">
                      <button onClick={() => { setJarToDelete(null); setShelfToDelete(null); }} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600">{t.cancel}</button>
                      <button onClick={shelfToDelete ? handleDeleteShelf : handleDeleteJar} className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white">{t.confirm}</button>
                  </div>
              </div>
          </div>
      )}

      {/* 6. Rename Shelf Modal */}
      {editingShelf && (
         <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">{t.editShelf}</h3>
                <input autoFocus type="text" value={editingShelf.new} onChange={e => setEditingShelf({...editingShelf, new: e.target.value})} className="w-full border-b border-gray-300 p-2 mb-6 outline-none text-xl" />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingShelf(null)} className="px-4 py-2 text-gray-500">{t.cancel}</button>
                    <button onClick={handleRenameShelf} className="px-4 py-2 bg-morandi-charcoal text-white rounded-lg">{t.save}</button>
                </div>
            </div>
         </div>
      )}

      {/* 7. Unlock Notification Modal */}
      {unlockNotification && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-drop-in">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                      <Lock size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-morandi-charcoal mb-2">{unlockNotification.title}</h3>
                  <p className="text-morandi-text mb-6">{unlockNotification.msg}</p>
                  <button onClick={() => setUnlockNotification(null)} className="w-full py-3 bg-morandi-charcoal text-white rounded-xl font-bold shadow-lg hover:bg-morandi-slate transition-colors">{t.ok}</button>
              </div>
          </div>
      )}

    </div>
  );

  const renderStats = () => {
      const maxStars = Math.max(...jars.map(j => j.stars.length), 1);
      return (
        <div className="min-h-screen p-8 max-w-6xl mx-auto bg-morandi-bg font-sans text-morandi-text">
            <header className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-morandi-charcoal flex items-center gap-2"><BarChart2 /> {t.progressReport}</h2>
                <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-gray-200 rounded-full"><X/></button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                     <div className="text-5xl font-bold text-morandi-charcoal mb-2">{jars.length}</div>
                     <div className="text-morandi-text uppercase tracking-wider text-xs">{t.totalHabits}</div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                     <div className="text-5xl font-bold text-morandi-charcoal mb-2">{totalStars}</div>
                     <div className="text-morandi-text uppercase tracking-wider text-xs">{t.totalMemories}</div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                     <div className="text-5xl font-bold text-morandi-charcoal mb-2 text-morandi-slate">{jars.length > 0 ? (totalStars / jars.length).toFixed(1) : '0'}</div>
                     <div className="text-morandi-text uppercase tracking-wider text-xs">{t.avgStars}</div>
                 </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <h3 className="text-xl font-bold text-morandi-charcoal mb-8 text-2xl">{t.starDist}</h3>
                <div className="flex items-end justify-around h-64 gap-4 overflow-x-auto pb-4">
                    {jars.map(jar => (
                        <div key={jar.id} className="flex flex-col items-center gap-2 group w-16 shrink-0">
                             <div className="relative w-full flex justify-center h-full items-end">
                                 <div className="w-8 rounded-t-lg transition-all duration-1000 ease-out relative group-hover:opacity-80" style={{ height: `${(jar.stars.length / maxStars) * 100}%`, backgroundColor: jar.themeColor, minHeight: jar.stars.length > 0 ? '10px' : '2px' }}>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{jar.stars.length}</div>
                                 </div>
                             </div>
                             <div className="text-xs text-morandi-text text-center truncate w-full font-bold" title={jar.name}>{jar.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  };

  const renderDetail = () => {
    if (!activeJar) return null;
    const canViewHistory = activeJar.stars.length >= 20;

    return (
      <div className="min-h-screen flex flex-col items-center bg-morandi-bg relative overflow-hidden font-sans text-morandi-text">
        <div className="absolute top-8 left-8 z-40">
           <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-morandi-text hover:text-morandi-charcoal transition-colors font-bold bg-white/50 px-4 py-2 rounded-full backdrop-blur-md"><ArrowLeft size={20} /> {t.back}</button>
        </div>
        <div className="flex-1 w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-12 p-8">
            <div className="relative mt-12 md:mt-0 flex justify-center">
                 <JarVisual stars={activeJar.stars} label={activeJar.name} themeColor={activeJar.themeColor} shape={activeJar.shape} size="lg" />
            </div>
            <div className="flex flex-col gap-6 w-full max-w-md">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/50">
                    <div className="flex justify-between items-start">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 w-full mb-2">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={tempJarName} 
                                    onChange={(e) => setTempJarName(e.target.value)}
                                    className="text-3xl font-bold text-morandi-charcoal border-b-2 border-morandi-slate outline-none w-full"
                                />
                                <button onClick={handleSaveJarName} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"><Check size={20}/></button>
                                <button onClick={() => setIsEditingName(false)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><X size={20}/></button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-4xl font-bold text-morandi-charcoal mb-2 break-all">{activeJar.name}</h2>
                                <button onClick={() => { setIsEditingName(true); setTempJarName(activeJar.name); }} className="p-2 text-gray-400 hover:text-morandi-charcoal"><Edit2 size={20}/></button>
                            </>
                        )}
                    </div>
                    
                    <p className="text-morandi-text mb-8 text-lg"><span className="font-bold text-morandi-slate text-2xl">{activeJar.stars.length}</span> {t.starsCollected}</p>
                    
                    <button onClick={startFolding} className="w-full py-4 bg-morandi-charcoal text-white rounded-xl shadow-lg hover:bg-morandi-slate transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-xl font-bold"><Plus size={24} /> {t.foldStar}</button>
                    
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleReflect} className="flex-1 py-3 bg-white border-2 border-morandi-sage text-morandi-sage font-bold rounded-xl hover:bg-morandi-sage hover:text-white transition-colors flex items-center justify-center gap-2"><Sparkles size={18} /> {t.reflectAI}</button>
                        
                        {/* History Button - Only shows if stars >= 20 */}
                        {canViewHistory && (
                             <button onClick={() => setShowHistoryModal(true)} className="flex-1 py-3 bg-white border-2 border-morandi-slate text-morandi-slate font-bold rounded-xl hover:bg-morandi-slate hover:text-white transition-colors flex items-center justify-center gap-2 animate-in fade-in"><History size={18} /> {t.viewHistory}</button>
                        )}
                    </div>

                </div>
                <div className="bg-white/50 p-6 rounded-3xl max-h-60 overflow-y-auto">
                    <h3 className="text-sm font-bold text-morandi-text uppercase tracking-wider mb-4">{t.recentMemories}</h3>
                    {activeJar.stars.length === 0 ? (<p className="text-sm text-gray-400 italic">{t.noNotes}</p>) : (
                        <ul className="space-y-4">{activeJar.stars.slice().reverse().slice(0, 5).map(star => (
                                <li key={star.id} className="text-lg text-morandi-charcoal border-b border-gray-200/50 pb-2 font-medium"><span className="text-xs text-gray-400 font-sans block mb-1 uppercase tracking-wide">{new Date(star.date).toLocaleDateString()}</span>"{star.content}"</li>
                        ))}</ul>
                    )}
                </div>
            </div>
        </div>
        
        {/* Detail Modals */}
        
        {/* History Modal */}
        {showHistoryModal && (
             <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[90] flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col border border-morandi-slate/20">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="text-3xl font-bold text-morandi-charcoal flex items-center gap-3"><Calendar className="text-morandi-slate"/> {t.historyTitle}</h3>
                         <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                        {activeJar.stars.slice().reverse().map((star, index) => (
                            <div key={star.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-morandi-slate mt-2 group-hover:scale-125 transition-transform"></div>
                                    <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                </div>
                                <div className="flex-1 pb-4">
                                    <span className="text-sm font-bold text-morandi-slate uppercase tracking-wider">{new Date(star.date).toLocaleString()}</span>
                                    <div className="mt-1 p-4 bg-morandi-bg/50 rounded-xl text-lg font-medium text-morandi-charcoal border-l-4 border-morandi-slate/30">
                                        "{star.content}"
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {/* Reflection Modal */}
        {isReflecting && (
             <div className="fixed inset-0 bg-morandi-charcoal/30 backdrop-blur-md z-[80] flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full relative border-4 border-white">
                    <button onClick={() => setIsReflecting(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={24} /></button>
                    <h3 className="text-3xl font-bold text-morandi-charcoal mb-6 flex items-center gap-2"><Sparkles className="text-morandi-dusty" /> {t.reflectAI}</h3>
                    {reflectionLoading ? (
                        <div className="flex flex-col items-center justify-center py-12"><Loader2 className="animate-spin text-morandi-slate w-10 h-10 mb-4" /><p className="text-morandi-text animate-pulse font-medium text-xl">Reading the stars...</p></div>
                    ) : (
                        <div className="prose prose-slate"><p className="font-medium text-xl leading-relaxed text-morandi-charcoal whitespace-pre-line">{reflectionText}</p></div>
                    )}
                </div>
             </div>
        )}

        {isFoldingStar && (
            <div className="fixed inset-0 bg-morandi-bg/95 z-[80] flex flex-col items-center justify-center p-4 transition-all">
                {foldingStage === 'writing' && (
                    <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="flex w-full justify-between items-center mb-10 px-4"><h3 className="text-3xl text-morandi-charcoal font-bold">{t.writeMemory}</h3><button onClick={() => setIsFoldingStar(false)} className="text-gray-400 hover:text-gray-600"><X size={32}/></button></div>
                        <div className="w-full h-28 shadow-2xl relative transition-colors duration-500 flex items-center px-8 transform -rotate-1 hover:rotate-0 transition-transform" style={{ backgroundColor: tempStarColor, backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}>
                            <textarea autoFocus value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value.slice(0, MAX_NOTE_LENGTH))} placeholder={t.todayFelt} className="w-full bg-transparent border-none outline-none font-medium text-3xl text-white placeholder-white/60 resize-none h-full pt-6 leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)'}} />
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-morandi-bg" style={{clipPath: 'polygon(0 0, 100% 10%, 0 20%, 100% 30%, 0 40%, 100% 50%, 0 60%, 100% 70%, 0 80%, 100% 90%, 0 100%)'}}></div><div className="absolute right-0 top-0 bottom-0 w-2 bg-morandi-bg" style={{clipPath: 'polygon(100% 0, 0 10%, 100% 20%, 0 30%, 100% 40%, 0 50%, 100% 60%, 0 70%, 100% 80%, 0 90%, 100% 100%)'}}></div>
                        </div>
                        <div className="mt-4 text-xs text-morandi-text/60 font-sans tracking-widest">{newNoteContent.length}/{MAX_NOTE_LENGTH} {t.chars}</div>
                        <div className="mt-12"><button onClick={processFold} disabled={!newNoteContent.trim()} className="px-12 py-4 bg-morandi-charcoal text-white rounded-full font-bold shadow-xl hover:bg-morandi-slate disabled:opacity-50 transition-all flex items-center gap-3 text-xl transform hover:scale-105 active:scale-95"><Send size={24} /> {t.foldIntoStar}</button></div>
                    </div>
                )}
                {foldingStage === 'animating' && (
                    <div className="flex flex-col items-center justify-center h-full w-full"><div className="relative flex items-center justify-center"><div className="h-16 bg-morandi-dusty shadow-md animate-fold-step-1 absolute" style={{ backgroundColor: tempStarColor }}></div><div className="h-16 w-32 bg-morandi-dusty shadow-md animate-fold-step-2 absolute rounded-sm" style={{ backgroundColor: tempStarColor }}></div><div className="animate-puff opacity-0 animate-fill-forwards" style={{ animationFillMode: 'forwards', animationDelay: '1.2s', animationDuration: '0.4s', animationName: 'puff, fadeIn' }}><StarVisual color={tempStarColor} size={120} rotation={15} /></div></div><p className="mt-24 text-3xl font-bold text-morandi-charcoal animate-pulse">{t.makingWish}</p></div>
                )}
                {foldingStage === 'dropping' && (
                    <div className="flex flex-col items-center justify-center relative h-screen w-full"><div className="absolute bottom-20 opacity-80 scale-90"><JarVisual stars={[]} label="" themeColor={activeJar.themeColor} shape={activeJar.shape} /></div><div className="animate-drop-in z-50 absolute top-20"><StarVisual color={tempStarColor} size={60} /></div></div>
                )}
            </div>
        )}
      </div>
    );
  };

  if (view === AppView.STATS) return renderStats();

  return (
    <div className="font-sans text-morandi-text selection:bg-morandi-sage selection:text-white">
      {view === AppView.DASHBOARD ? renderDashboard() : renderDetail()}
    </div>
  );
}

export default App;