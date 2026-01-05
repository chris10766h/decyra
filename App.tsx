import React, { useState, useEffect, useRef } from 'react';
import { Session, ProcessingStatus, DecyraAnalysis, User } from './types';
import { analyzeAudio, analyzeText, blobToBase64 } from './services/geminiService';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { EmptyState } from './components/EmptyState';
import { AnalysisView } from './components/AnalysisView';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AuthScreen } from './components/AuthScreen';
import { Plus, Search, Mic, StopCircle, Clock, ChevronRight, Layout, Loader2, Trash2, LogOut, UserCircle, Menu, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize User
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const savedSessions = storageService.loadSessions(currentUser.id);
      setSessions(savedSessions);
    }
    setIsLoadingData(false);
  }, []);

  // Save data on change
  useEffect(() => {
    if (user && !isLoadingData) {
      storageService.saveSessions(user.id, sessions);
    }
  }, [sessions, user, isLoadingData]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when selecting a session
  useEffect(() => {
    if (currentSessionId) {
      setIsMobileMenuOpen(false);
    }
  }, [currentSessionId]);

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session => {
    const q = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(q) ||
      session.analysis?.academicSummary.toLowerCase().includes(q) ||
      session.analysis?.transcript.toLowerCase().includes(q)
    );
  });

  const activeSession = sessions.find(s => s.id === currentSessionId);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(blob, `Clase ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        
        // Cleanup stream tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Por favor verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (file: File) => {
    processAudio(file, file.name.replace(/\.[^/.]+$/, ""));
  };

  const processAudio = async (audioBlob: Blob, title: string) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: title,
      date: new Date(),
      durationSeconds: 0,
      status: ProcessingStatus.PROCESSING,
      audioBlob: audioBlob
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsMobileMenuOpen(false);

    try {
      const base64 = await blobToBase64(audioBlob);
      const result = await analyzeAudio(base64, audioBlob.type || 'audio/webm');

      setSessions(prev => prev.map(s => 
        s.id === newSession.id 
          ? { ...s, status: ProcessingStatus.COMPLETED, analysis: result } 
          : s
      ));
    } catch (error) {
      console.error("Processing failed", error);
      setSessions(prev => prev.map(s => 
        s.id === newSession.id 
          ? { ...s, status: ProcessingStatus.ERROR } 
          : s
      ));
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (window.confirm('¿Estás seguro de que quieres eliminar estos apuntes permanentemente?')) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    }
  };

  const handleUpdateAnalysis = async (newAnalysis: DecyraAnalysis) => {
    if (!currentSessionId) return;

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession || !currentSession.analysis) return;

    const transcriptChanged = newAnalysis.transcript !== currentSession.analysis.transcript;

    if (transcriptChanged) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, status: ProcessingStatus.PROCESSING }
          : s
      ));

      try {
        const regeneratedAnalysis = await analyzeText(newAnalysis.transcript);
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, status: ProcessingStatus.COMPLETED, analysis: regeneratedAnalysis }
            : s
        ));
      } catch (error) {
        console.error("Failed to regenerate notes from transcript", error);
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, status: ProcessingStatus.ERROR } 
            : s
        ));
      }
    } else {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, analysis: newAnalysis }
          : s
      ));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoadingData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-80 bg-slate-100 border-r border-slate-200 flex flex-col shrink-0
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-200/50 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentSessionId(null); setIsMobileMenuOpen(false); }}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="font-bold text-lg tracking-tight">DECYRA</span>
          </div>
          <button 
            className="md:hidden p-1 text-slate-400 hover:bg-slate-200 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
           <button 
            onClick={() => { setCurrentSessionId(null); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-95 mb-4"
          >
            <Plus className="w-4 h-4" />
            Nueva Clase
          </button>

           <div className="relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar apuntes..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
           <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Biblioteca</h3>
           <div className="space-y-1">
             {filteredSessions.map(session => (
               <div
                 key={session.id}
                 onClick={() => setCurrentSessionId(session.id)}
                 className={`relative w-full text-left p-3 rounded-lg transition-all cursor-pointer group ${
                   currentSessionId === session.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200/50'
                 }`}
               >
                 <div className="flex justify-between items-start mb-1">
                   <span className={`font-medium truncate pr-8 ${currentSessionId === session.id ? 'text-slate-900' : 'text-slate-700'}`}>
                     {session.title}
                   </span>
                   {session.status === ProcessingStatus.PROCESSING && (
                     <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0 mt-1" />
                   )}
                 </div>
                 <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.date.toLocaleDateString()}</span>
                    {session.status === ProcessingStatus.COMPLETED && (
                       <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                          Listo
                       </span>
                    )}
                 </div>
                 
                 <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                    title="Eliminar apuntes"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {filteredSessions.length === 0 && sessions.length > 0 && (
               <div className="px-4 py-8 text-center text-sm text-slate-400">
                 No se encontraron resultados
               </div>
             )}
             {sessions.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400 italic">
                  Tus clases guardadas aparecerán aquí.
                </div>
             )}
           </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-colors">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 shrink-0">
                 <UserCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                 <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg shadow-sm transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col w-full">
        
        {/* Mobile Header - Visible only on mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">DECYRA</span>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {isRecording ? (
            /* Recording Overlay */
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="w-full max-w-lg space-y-8 text-center p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full" /> Grabando clase
                  </div>
                  
                  <h2 className="text-6xl font-bold tabular-nums text-slate-900 tracking-tighter">
                    {formatTime(recordingTime)}
                  </h2>

                  <AudioVisualizer stream={streamRef.current} isRecording={isRecording} />
                  
                  <button
                    onClick={stopRecording}
                    className="mx-auto flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95 w-full md:w-auto justify-center"
                  >
                    <StopCircle className="w-6 h-6 fill-current" />
                    Finalizar
                  </button>
                  <p className="text-slate-400 text-sm">DECYRA está escuchando al profesor...</p>
              </div>
            </div>
          ) : null}

          {activeSession ? (
            activeSession.status === ProcessingStatus.PROCESSING ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-6" />
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                  {activeSession.audioBlob ? "Generando apuntes..." : "Regenerando apuntes..."}
                </h2>
                <p className="text-slate-500 max-w-md text-sm md:text-base">
                  {activeSession.audioBlob 
                    ? "Decyra está redactando los apuntes y extrayendo conceptos clave." 
                    : "Decyra está actualizando los apuntes basándose en tu nueva transcripción."}
                </p>
              </div>
            ) : activeSession.status === ProcessingStatus.ERROR ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <StopCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Error en el análisis</h2>
                <p className="text-slate-500 mb-6">No pudimos procesar el audio correctamente.</p>
                <button onClick={() => setSessions(s => s.filter(x => x.id !== activeSession.id))} className="text-red-600 hover:underline">Eliminar clase</button>
              </div>
            ) : (
              <AnalysisView 
                analysis={activeSession.analysis!} 
                title={activeSession.title}
                onUpdate={handleUpdateAnalysis}
              />
            )
          ) : (
            <EmptyState onStartRecording={startRecording} onUpload={handleFileUpload} />
          )}
        </div>
      </main>
    </div>
  );
}