// Giao diện hỗ trợ trực tuyến và trung tâm chat giữa học sinh và quản trị viên
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import type { User, Message } from '../types';
import { Button, Badge } from './UI';
import { db } from '../firebase'; 
import { collection, onSnapshot } from 'firebase/firestore';
interface SupportViewProps {
  user: User | null;
  onlineUsers: Record<string, boolean>;
  chatMessages: Message[];
  supportConversations: any[];
  setSupportConversations: (convs: any[]) => void;
  openChat: (friend: User) => Promise<void>;
  sendMessage: (e: React.FormEvent) => void;
  handleRecallMessage: (id: string) => void;
  activeChat: User | null;
  setView: (v: any) => void;
}

const SupportView: React.FC<SupportViewProps> = ({ 
  user, 
  onlineUsers, 
  chatMessages, 
  supportConversations, 
  setSupportConversations, 
  openChat, 
  sendMessage, 
  handleRecallMessage,
  activeChat,
  setView
}) => {
  const [selectedUser, setSelectedUser] = useState<any>(activeChat);
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    if (activeChat && user?.role === 'admin' && activeChat.id !== selectedUser?.id) {
      setSelectedUser(activeChat);
    }
  }, [activeChat, user, selectedUser]);
  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'admin') {
      fetch('/api/admin/support/conversations')
        .then(res => res.json())
        .then(setSupportConversations)
        .catch(console.error);
    } else if (user && !selectedUser && !hasAutoSelected.current) {
      const adminUser: User = { id: 'admin', username: 'Quản trị viên', role: 'admin' as any, isBlocked: false, online: true };
      hasAutoSelected.current = true;
      setSelectedUser(adminUser);
      openChat(adminUser);
    }
  }, [user, selectedUser, openChat, setSupportConversations]);

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    openChat(u);
  };

  useEffect(() => {
  if (!user || user.role !== 'admin') return;
  
  // Thay vì fetch, dùng onSnapshot để lấy data realtime
  const unsub = onSnapshot(collection(db, "support_conversations"), (snap) => {
    const convs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSupportConversations(convs);
  });
  
  return () => unsub();
}, [user]);

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {user?.role === 'admin' && (
        <div className="w-80 border-r border-border-theme bg-white flex flex-col">
          <div className="p-4 border-b border-border-theme bg-slate-50">
            <h3 className="text-xs font-black uppercase tracking-widest text-sidebar">Hỗ trợ học sinh</h3>
            <p className="text-[10px] opacity-50 font-bold uppercase mt-1">Các cuộc hội thoại gần đây</p>
          </div>
          <div className="flex-1 overflow-auto">
            {supportConversations.length === 0 ? (
              <div className="p-10 text-center opacity-30 text-[11px] font-black uppercase tracking-tighter">
                Chưa có tin nhắn hỗ trợ nào
              </div>
            ) : (
              supportConversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => handleSelectUser(conv)}
                  className={cn(
                    "p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50",
                    selectedUser?.id === conv.id && "bg-accent/5 border-l-4 border-l-accent"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black uppercase tracking-tight">{conv.username}</span>
                    <span className="text-[8px] opacity-40 font-bold">
                      {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-slate-50 relative">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-black uppercase tracking-widest text-sidebar">Trung tâm Hỗ trợ</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase mt-2">Chọn một học sinh từ danh sách bên trái để bắt đầu hỗ trợ trực tiếp.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-white border-b border-border-theme flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-sidebar flex items-center justify-center text-white font-black uppercase text-xs shadow-md">
                  {selectedUser.username.slice(0, 2)}
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest">{selectedUser.username}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-2 h-2 rounded-full", onlineUsers[selectedUser.id] ? "bg-emerald-500" : "bg-slate-500")} />
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-tighter">
                      {onlineUsers[selectedUser.id] ? 'Trực tuyến' : 'Ngoại tuyến'}
                    </span>
                  </div>
                </div>
              </div>
              {user?.role === 'user' && (
                <Badge className="bg-emerald-100 text-emerald-700">Support Ready</Badge>
              )}
            </div>

            <div id="support-chat-history" className="flex-1 overflow-auto p-6 space-y-4 bg-pattern">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-2">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-center">Bắt đầu cuộc trò chuyện</p>
                </div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={m.id || idx} className={cn("flex flex-col", m.senderId === user?.id ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[70%] p-4 rounded-2xl shadow-sm text-[12px] font-medium leading-relaxed",
                      m.isRecalled ? "bg-slate-100 text-slate-400 italic" : 
                      m.senderId === user?.id ? "bg-sidebar text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-border-theme"
                    )}>
                      {m.isRecalled ? "Tin nhắn đã được thu hồi" : m.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">
                        {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {m.senderId === user?.id && !m.isRecalled && (
                        <button onClick={() => handleRecallMessage(m.id)} className="text-[8px] font-black uppercase text-warning/50 hover:text-warning transition-colors">Thu hồi</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-border-theme shadow-lg z-10">
              <div className="flex gap-2 mb-3">
                 {['Hỏi đáp', 'Góp ý', 'Báo lỗi'].map(type => (
                   <button 
                     key={type}
                     onClick={() => {
                        const input = document.querySelector('input[name="message"]') as HTMLInputElement;
                        if(input) {
                          input.value = `[${type.toUpperCase()}] ` + input.value.replace(/^\[.*?\]\s*/, '');
                          input.focus();
                        }
                     }}
                     className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 border border-slate-100 rounded-full hover:bg-accent/10 hover:border-accent transition-colors"
                   >
                     {type}
                   </button>
                 ))}
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(e);
                  (e.target as HTMLFormElement).reset();
                }} 
                className="flex gap-3"
              >
                <input 
                  name="message" 
                  autoComplete="off"
                  placeholder="Nhập nội dung hỗ trợ hoặc góp ý của bạn..." 
                  className="flex-1 h-12 bg-slate-50 border border-border-theme rounded-xl px-4 text-xs focus:ring-2 focus:ring-accent outline-none shadow-inner" 
                />
                <Button type="submit" className="h-12 w-12 rounded-xl p-0 shadow-lg active:scale-95">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportView;
