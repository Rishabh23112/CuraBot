import { Loader2, Menu, MessageSquare, PanelLeftClose, Paperclip, Plus, RefreshCw, Send, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { deleteSession as deleteSessionApi, getSessionMessages, getSessions, sendChatMessage } from '../services/api';
import { ChatSession, Message, User } from '../types';

interface ChatProps {
  user: User;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions from backend on mount
  useEffect(() => {
    if (user.email) {
      fetchSessions();
    }
  }, [user.email]);

  const fetchSessions = async () => {
    setIsFetchingHistory(true);
    setError(null);
    try {
      const backendSessions = await getSessions(user.email);

      if (backendSessions.length === 0) {
        // No sessions, create a new one
        const newSession = createNewLocalSession();
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
      } else {
        // Convert backend sessions to frontend format
        const convertedSessions: ChatSession[] = backendSessions.map(s => ({
          id: s.session_id,
          title: s.title || 'Conversation',
          timestamp: s.updated_at ? new Date(s.updated_at).getTime() : Date.now(),
          messages: [] // Messages will be loaded when session is selected
        }));

        setSessions(convertedSessions);
        setCurrentSessionId(convertedSessions[0].id);

        // Load messages for the first session
        await loadSessionMessages(convertedSessions[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      // Fall back to creating a new local session
      const newSession = createNewLocalSession();
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const sessionData = await getSessionMessages(sessionId, user.email);

      const messages: Message[] = sessionData.messages.map((msg, idx) => ({
        id: `${sessionId}_${idx}`,
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.content,
        timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()
      }));

      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, messages, title: sessionData.title || s.title }
          : s
      ));
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const createNewLocalSession = (): ChatSession => ({
    id: `${user.email}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Conversation',
    timestamp: Date.now(),
    messages: [{
      id: 'init',
      role: 'model',
      text: `Hello ${user.name}. I'm here to listen. How are you feeling today?`,
      timestamp: Date.now()
    }]
  });

  // Scroll effect
  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, isLoading]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const createNewSession = () => {
    const newSession = createNewLocalSession();
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);

    // Load messages if not already loaded
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.messages.length === 0) {
      await loadSessionMessages(sessionId);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        // Delete from backend
        await deleteSessionApi(sessionId, user.email);

        const updatedSessions = sessions.filter(s => s.id !== sessionId);

        if (updatedSessions.length === 0) {
          const newSession = createNewLocalSession();
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
        } else {
          setSessions(updatedSessions);
          if (currentSessionId === sessionId) {
            setCurrentSessionId(updatedSessions[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to delete session:', err);
        // Still remove from local state
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        if (updatedSessions.length === 0) {
          const newSession = createNewLocalSession();
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
        } else {
          setSessions(updatedSessions);
          if (currentSessionId === sessionId) {
            setCurrentSessionId(updatedSessions[0].id);
          }
        }
      }
    }
  };

  const clearAllHistory = async () => {
    if (window.confirm("Are you sure you want to delete ALL chat history? This cannot be undone.")) {
      // Delete all sessions from backend
      for (const session of sessions) {
        try {
          await deleteSessionApi(session.id, user.email);
        } catch (err) {
          console.error('Failed to delete session:', session.id, err);
        }
      }

      const newSession = createNewLocalSession();
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      setIsSidebarOpen(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading || !currentSessionId) return;

    const currentSessionIndex = sessions.findIndex(s => s.id === currentSessionId);
    if (currentSessionIndex === -1) return;

    const currentSession = sessions[currentSessionIndex];

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      attachments: selectedFile && previewUrl ? [{ type: 'image', url: previewUrl, mimeType: selectedFile.type }] : undefined
    };

    // Update sessions state optimistically
    const updatedMessages = [...currentSession.messages, userMsg];

    // Update title if it's the first user message (after init)
    let newTitle = currentSession.title;
    if (currentSession.messages.length === 1 && currentSession.messages[0].id === 'init') {
      newTitle = input.length > 30 ? input.substring(0, 30) + '...' : input;
    }

    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      title: newTitle,
      timestamp: Date.now()
    };

    const newSessions = [...sessions];
    newSessions[currentSessionIndex] = updatedSession;
    newSessions.sort((a, b) => b.timestamp - a.timestamp);

    setSessions(newSessions);
    const messageToSend = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Send to backend API
      const response = await sendChatMessage(
        currentSessionId,
        messageToSend,
        user.email,
        user.name,
        user.address,
        selectedFile || undefined,
        newTitle  // Pass title for persistence
      );

      clearFile();

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.reply,
        timestamp: Date.now()
      };

      // Update with model response
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === currentSessionId);
        if (idx === -1) return prev;

        const sess = prev[idx];
        const finalMessages = [...sess.messages, modelMsg];
        const finalSession = { ...sess, messages: finalMessages, timestamp: Date.now() };

        const nextSessions = [...prev];
        nextSessions[idx] = finalSession;
        return nextSessions;
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to send message');

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting to the server. Please check your connection and try again.",
        timestamp: Date.now()
      };

      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === currentSessionId);
        if (idx === -1) return prev;
        const sess = prev[idx];
        const nextSessions = [...prev];
        nextSessions[idx] = { ...sess, messages: [...sess.messages, errorMsg] };
        return nextSessions;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Safe fallback to first session if currentSessionId is momentarily invalid
  const activeSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  if (isFetchingHistory) {
    return (
      <div className="h-[100dvh] relative bg-slate-900 flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] relative bg-slate-900 flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2574&auto=format&fit=crop"
          alt="Nature Background"
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 flex h-full w-full">

        {/* Overlay - visible on all screens when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar - fixed and hidden by default on all screens */}
        <div className={`
              fixed top-0 left-0 z-[60] h-full w-80 flex flex-col
              bg-slate-900/30 backdrop-blur-xl border-r border-white/10 shadow-2xl
              transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
          <div className="p-4 pt-6 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">History</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchSessions}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Refresh history"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={createNewSession}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Previous Conversations</h3>
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`
                            group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                            ${currentSessionId === session.id
                    ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }
                        `}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-2">
                  <MessageSquare size={18} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-cyan-400' : 'text-gray-600'}`} />
                  <div className="truncate flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-[10px] opacity-60">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors z-10 flex-shrink-0"
                  title="Delete Conversation"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 space-y-4">
            <button
              onClick={clearAllHistory}
              className="w-full py-2.5 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium flex items-center justify-center gap-2 group"
            >
              <Trash2 size={14} className="group-hover:text-red-300" /> Clear All History
            </button>

            <div className="flex items-center gap-3 pt-2">
              <img
                src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                alt="User"
                className="w-8 h-8 rounded-full bg-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative w-full">

          {/* Top Header - adjusted for top navbar */}
          <div className="h-32 flex items-end pb-4 px-4 md:px-6 border-b border-white/5 bg-slate-900/30 backdrop-blur-xl absolute top-0 left-0 right-0 z-20">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white mr-3 hover:bg-white/5 rounded-full transition-colors"
              title="Open Menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20">
                CB
              </div>
              <div>
                <h2 className="text-white font-bold text-base md:text-lg leading-tight">CuraBot</h2>
                <p className="text-[11px] text-green-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Always here for you
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 custom-scrollbar scroll-smooth">
            {/* Spacer to push content down below fixed header */}
            <div className="h-36 w-full flex-shrink-0" aria-hidden="true" />

            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {activeSession?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mr-3 mt-1 shadow-lg shadow-cyan-500/20 select-none">
                      CB
                    </div>
                  )}
                  <div className={`
                                max-w-[85%] md:max-w-[75%] min-w-0
                                ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-cyan-900/20'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm'
                    }
                                p-4 md:p-5
                              `}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-3">
                        <img src={msg.attachments[0].url} alt="attachment" className="rounded-lg max-h-60 object-cover w-full" />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-sm md:text-[15px]">{msg.text}</p>
                    <span className={`text-xs mt-2 block ${msg.role === 'user' ? 'text-cyan-200' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mr-3 mt-1 select-none">
                    CB
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/5 px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 size={16} className="animate-spin text-cyan-400" /> CuraBot is thinking...
                  </div>
                </div>
              )}
              {/* Spacer to ensure last message is not hidden behind the input/navbar */}
              <div ref={messagesEndRef} className="h-8" />
            </div>
          </div>

          {/* Input Area - Reduced bottom padding since navbar is top */}
          <div className="p-4 md:p-6 pb-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
            <div className="max-w-3xl mx-auto">
              {error && (
                <div className="mb-3 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs text-center">
                  {error}
                </div>
              )}
              <GlassCard className="p-2 flex flex-col gap-2 !rounded-3xl !bg-slate-800/80 border-t border-white/10 shadow-2xl">
                {previewUrl && (
                  <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5">
                    <div className="relative group">
                      <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-white/20" />
                      <button
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">Image attached</span>
                  </div>
                )}

                <div className="flex items-end gap-2 px-2 pb-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all mb-1"
                    title="Attach image"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                  />

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none max-h-32 min-h-[48px] py-3 px-2 custom-scrollbar text-sm md:text-base break-words"
                    rows={1}
                  />

                  <button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && !selectedFile)}
                    className={`
                                    p-3 rounded-full transition-all mb-1
                                    ${(!input.trim() && !selectedFile) || isLoading
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95'
                      }
                                 `}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </GlassCard>
              <p className="text-center text-[10px] text-gray-600 mt-2">
                CuraBot can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Chat;