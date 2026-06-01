
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMessages, sendMessage, getConversation, getFanConversations, markConversationRead } from "@/lib/localDb";
import type { Message } from "@/lib/localDb";
import type { FanTier } from "@/lib/localDb";
import { Link } from "react-router";
import {
  MessageSquare, Send, User, Crown, Lock, ChevronLeft,
  Clock, Star, Circle,
} from "lucide-react";

const KING_ID = "king";

export default function Messages() {
  const { user, isAuthenticated, isKing, isFanatic, tier } = useAuth();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [activeFan, setActiveFan] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setAllMessages(getMessages());
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, activeFan]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#1a1d21] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#e8e6e3] mb-2">Login Required</h2>
          <p className="text-sm text-[#8b8680] mb-6">Login to send messages.</p>
          <Link to="/login" className="px-6 py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Go to Login</Link>
        </div>
      </div>
    );
  }

  const fanConversations = isKing ? getFanConversations() : [];
  const currentConversation = activeFan
    ? getConversation(KING_ID, activeFan)
    : !isKing
    ? getConversation(user.id, KING_ID)
    : [];

  const handleSend = () => {
    if (!messageText.trim()) return;
    const senderTier: FanTier = isKing ? "fanatic" : (tier || "fan");
    if (isKing && activeFan) {
      sendMessage(messageText.trim(), KING_ID, user.name, senderTier, activeFan);
    } else if (!isKing) {
      sendMessage(messageText.trim(), user.id, user.name, senderTier, KING_ID);
    }
    setMessageText("");
    setAllMessages(getMessages());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectFan = (fanId: string) => {
    setActiveFan(fanId);
    markConversationRead(fanId);
    setAllMessages(getMessages());
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] pt-16 pb-0">
      <div className="h-[calc(100vh-64px)] flex max-w-[1100px] mx-auto">
        {/* Sidebar — King's conversation list */}
        {isKing && (
          <div className={`w-80 border-r border-[rgba(201,169,110,0.1)] bg-[#1a1d21] flex flex-col ${activeFan ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-[rgba(201,169,110,0.1)]">
              {/* Rename Fan Messages heading to emphasize that all supporters are called Fanatics */}
              <h2 className="font-serif text-lg font-bold text-[#e8e6e3]">Fanatic Messages</h2>
              <p className="text-xs text-[#8b8680]">
                <Star className="w-3 h-3 text-[#c9a96e] inline" /> Fanatics appear first
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fanConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-[#3a3d42] mx-auto mb-2" />
                  <p className="text-xs text-[#8b8680]">No messages yet</p>
                </div>
              ) : (
                fanConversations.map((conv) => (
                  <button key={conv.fanId} onClick={() => selectFan(conv.fanId)}
                    className={`w-full flex items-start gap-3 p-4 text-left transition-all hover:bg-[#23262a] ${activeFan === conv.fanId ? "bg-[#23262a] border-l-2 border-[#c9a96e]" : "border-l-2 border-transparent"}`}>
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${conv.fanTier === "fanatic" ? "bg-[rgba(201,169,110,0.15)]" : "bg-[#2a2d32]"}`}>
                        <User className={`w-5 h-5 ${conv.fanTier === "fanatic" ? "text-[#c9a96e]" : "text-[#8b8680]"}`} />
                      </div>
                      {conv.fanTier === "fanatic" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#c9a96e] flex items-center justify-center border border-[#1a1d21]">
                          <Star className="w-2.5 h-2.5 text-[#1a1d21]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-[#e8e6e3] truncate">{conv.fanName}</span>
                          {/* All supporters are treated as Fanatics, so always show the star icon */}
                          <Star className="w-3 h-3 text-[#c9a96e] flex-shrink-0" />
                        </div>
                        {conv.unread > 0 && <span className="bg-[#c9a96e] text-[#1a1d21] text-[10px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">{conv.unread}</span>}
                      </div>
                      <p className="text-xs text-[#8b8680] truncate mt-0.5">{conv.lastMessage.content}</p>
                      <span className="text-[10px] text-[#8b8680]">{new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#1a1d21]">
          <div className="flex items-center gap-3 p-4 border-b border-[rgba(201,169,110,0.1)]">
            {isKing && activeFan && <button onClick={() => setActiveFan(null)} className="md:hidden p-1 text-[#8b8680]"><ChevronLeft className="w-5 h-5" /></button>}
            <div className="w-8 h-8 rounded-full bg-[#2a2d32] flex items-center justify-center">
              {isKing ? <User className="w-4 h-4 text-[#8b8680]" /> : <Crown className="w-4 h-4 text-[#c9a96e]" />}
            </div>
            <div>
              <span className="text-sm font-medium text-[#e8e6e3]">
                {isKing ? (activeFan ? fanConversations.find((c) => c.fanId === activeFan)?.fanName || "Select a fan" : "Select a conversation") : "The Creator"}
              </span>
              {isKing && activeFan && (
                // Always label the selected supporter as a Fanatic since there is only one free tier
                <span className="ml-2 text-xs text-[#c9a96e] font-mono">FANATIC</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isKing && !activeFan ? (
              <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" /><p className="text-[#8b8680] text-sm">Select a fan from the sidebar</p></div></div>
            ) : currentConversation.length === 0 ? (
              <div className="text-center py-8"><MessageSquare className="w-8 h-8 text-[#3a3d42] mx-auto mb-2" /><p className="text-xs text-[#8b8680]">Start a conversation</p></div>
            ) : (
              currentConversation.map((msg) => {
                const isMine = msg.senderId === user.id;
                const bubbleClass = isMine
                  ? "bg-[#c9a96e] text-[#1a1d21] rounded-br-md"
                  : "bg-[#23262a] text-[#e8e6e3] rounded-bl-md border border-[rgba(201,169,110,0.08)]";
                const metaClass = isMine ? "text-[#1a1d21]/60" : "text-[#8b8680]";
                return (
                  <div key={msg.id} className={isMine ? "flex justify-end" : "flex justify-start"}>
                    <div className={"max-w-[70%] rounded-2xl px-4 py-3 " + bubbleClass}>
                      {!isMine && <p className="text-xs text-[#c9a96e] mb-1 font-medium flex items-center gap-1">{msg.senderName} {msg.senderTier === "fanatic" && <Star className="w-2.5 h-2.5" />}</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={"flex items-center gap-1 mt-1 " + metaClass}>
                        <Clock className="w-3 h-3" /><span className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {(!isKing || activeFan) && (
            <div className="p-4 border-t border-[rgba(201,169,110,0.1)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  // Use a unified placeholder for all supporters; fans have priority messaging since there is only one tier
                  placeholder={isKing ? "Reply to fan..." : "Priority message to creator..."}
                  className="flex-1 bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-3 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] transition-colors"
                />
                <button onClick={handleSend} disabled={!messageText.trim()} className="p-3 bg-[#c9a96e] text-[#1a1d21] rounded-lg hover:bg-[#d4b87a] transition-colors disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </div>
              {!isKing && isFanatic && <p className="text-[10px] text-[#c9a96e] mt-1.5 flex items-center gap-1"><Star className="w-2.5 h-2.5" /> Your messages are prioritized in the creator's inbox</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}