
import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Heart,
  Bookmark,
  Clock,
  Lock,
  Crown,
  Plus,
  X,
  Download,
  Star,
  Image,
  Video,
  Music,
  File,
  Pen,
  MessageCircle,
  DollarSign,
  Send,
  BarChart3,
  FolderOpen,
  Bot,
  Broadcast,
  X as XIcon,
  Facebook,
  Spotify,
  Music as MusicIcon,
  Ghost,
  Twitch,
} from "lucide-react";
import { toast } from "sonner";
import { getSocialLinks, getKingLive, type SocialLink } from "@/lib/localDb";

// We no longer expose arbitrary filter options in the feed. Posts are always sorted
// by recency. Category filtering is done via the `category` query parameter (video, writing).

type MediaType = "image" | "video" | "audio" | "document" | "none";

const MEDIA_ICONS: Record<MediaType, React.ReactNode> = {
  image: <Image className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  document: <File className="w-4 h-4" />,
  none: null,
};

// Filter definitions removed. Sorting and filtering are driven solely by URL parameters.

interface TipModalProps { postId: number; postTitle: string; onClose: () => void; }

function TipModal({ postId, postTitle, onClose }: TipModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("3");
  const tipMut = trpc.tip.create.useMutation({ onSuccess: () => { toast.success(`Tipped $${amount}!`); onClose(); } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative liquid-glass rounded-2xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button>
        <DollarSign className="w-10 h-10 text-[#c9a96e] mx-auto mb-4" />
        <h3 className="font-serif text-xl text-center text-[#e8e6e3] mb-1">Send a Tip</h3>
        <p className="text-xs text-[#8b8680] text-center mb-6 line-clamp-1">{postTitle}</p>
        <div className="flex gap-2 mb-4">
          {["1", "3", "5"].map((p) => (
            <button key={p} onClick={() => setAmount(p)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${amount === p ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#1a1d21] text-[#8b8680] hover:text-[#e8e6e3]"}`}>${p}</button>
          ))}
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] mb-4 focus:outline-none focus:border-[#c9a96e]" placeholder="Amount" />
        <button onClick={() => tipMut.mutate({ postId, fromId: user?.id || "anon", fromName: user?.name || "Anonymous", amount })} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Send Tip</button>
      </div>
    </div>
  );
}

function isCommentAutoLiked(commentId: number): boolean {
  try { const al = JSON.parse(localStorage.getItem("ch_autoliked_comments") || "{}"); return !!al[String(commentId)]; } catch { return false; }
}

interface CommentSectionProps { postId: number; }

function CommentSection({ postId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: comments = [] } = trpc.comment.list.useQuery({ postId });
  const utils = trpc.useUtils();
  const [text, setText] = useState("");
  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => { utils.comment.list.invalidate({ postId }); setText(""); toast.success("Comment posted!"); },
  });

  return (
    <div className="mt-4 pt-4 border-t border-[rgba(201,169,110,0.08)]">
      <h4 className="text-xs font-mono text-[#8b8680] mb-3 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {comments.length} Comments</h4>
      {comments.length > 0 && (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {comments.map((c: any) => {
            const aiLiked = isCommentAutoLiked(c.id);
            return (
              <div key={c.id} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-[rgba(201,169,110,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] text-[#c9a96e] font-bold">{(c.authorName || "?").charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#e8e6e3]">{c.authorName}</span>
                    {c.authorTier === "fanatic" && <Star className="w-2.5 h-2.5 text-[#c9a96e]" />}
                    {aiLiked && <span className="flex items-center gap-0.5 text-[9px] text-[#4caf93] bg-[rgba(76,175,147,0.1)] px-1.5 py-0.5 rounded"><Bot className="w-2.5 h-2.5" /> AI liked</span>}
                  </div>
                  <p className="text-xs text-[#8b8680] leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isAuthenticated && (
        <div className="flex gap-2">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && text.trim() && createComment.mutate({ postId, authorId: user?.id || "", authorName: user?.name || "", authorTier: (user?.tier as any) || "fan", content: text })}
            className="flex-1 bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2 text-xs text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Write a comment..." />
          <button onClick={() => text.trim() && createComment.mutate({ postId, authorId: user?.id || "", authorName: user?.name || "", authorTier: (user?.tier as any) || "fan", content: text })} className="p-2 bg-[#c9a96e] text-[#1a1d21] rounded-lg hover:bg-[#d4b87a]"><Send className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}

function PollWidget() {
  const { user, isAuthenticated } = useAuth();
  const { data: polls = [] } = trpc.poll.list.useQuery();
  const utils = trpc.useUtils();
  const voteMut = trpc.poll.vote.useMutation({ onSuccess: () => { utils.poll.list.invalidate(); toast.success("Vote recorded!"); }, onError: (e) => toast.error(e.message) });
  const totalVotes = (poll: any) => Object.values(poll.votes || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0);

  return (
    <div className="space-y-4 mb-6">
      {polls.slice(0, 1).map((poll: any) => {
        const tv = totalVotes(poll);
        const userId = user?.id || "";
        const userHasVoted = (poll.votedBy || []).includes(userId);
        return (
          <div key={poll.id} className="bg-[#23262a] rounded-xl border border-[rgba(201,169,110,0.08)] p-5">
            <p className="text-sm text-[#e8e6e3] font-medium mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#c9a96e]" /> {poll.question}</p>
            <div className="space-y-1.5">
              {poll.options.map((opt: string, i: number) => {
                const votes = poll.votes[i] || 0;
                const pct = tv > 0 ? Math.round((votes / tv) * 100) : 0;
                return (
                  <button key={i} onClick={() => !userHasVoted && voteMut.mutate({ id: poll.id, optionIndex: i, userId })} disabled={userHasVoted}
                    className={`w-full relative text-left px-3 py-2 rounded-lg text-xs transition-all overflow-hidden ${userHasVoted ? "bg-[#1a1d21]" : "bg-[#1a1d21] hover:bg-[rgba(201,169,110,0.1)] cursor-pointer"}`}>
                    {userHasVoted && <div className="absolute inset-y-0 left-0 bg-[rgba(201,169,110,0.12)]" style={{ width: `${pct}%` }} />}
                    <span className="relative z-10 flex justify-between"><span className="text-[#e8e6e3]">{opt}</span>{userHasVoted && <span className="text-[#8b8680]">{votes}</span>}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Feed() {
  const { isAuthenticated, isKing, isFanatic, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: posts = [] } = trpc.post.list.useQuery();
  const { data: collections = [] } = trpc.collection.list.useQuery();
  // Social links (for the left sidebar) and King live state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [kingLive, setKingLiveState] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "thought" as const, tier: "public" as const, mediaType: "none" as MediaType, mediaUrl: null as string | null, downloadUrl: null as string | null, scheduledFor: null as string | null });
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [tipPostId, setTipPostId] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);

  // Map social platform identifiers to Lucide icons. If a platform is not recognized,
  // default to the X icon.
  const iconMap: Record<string, any> = {
    x: XIcon,
    tiktok: Video,
    facebook: Facebook,
    spotify: Spotify,
    snapchat: Ghost,
    twitch: Twitch,
    ytmusic: MusicIcon,
  };

  const createPost = trpc.post.create.useMutation({ onSuccess: () => { utils.post.list.invalidate(); setShowCreate(false); setNewPost({ title: "", content: "", type: "thought", tier: "public", mediaType: "none", mediaUrl: null, downloadUrl: null, scheduledFor: null }); toast.success("Post published!"); } });
  const likeMut = trpc.post.like.useMutation({ onSuccess: () => utils.post.list.invalidate() });
  const favMut = trpc.favorite.toggle.useMutation({ onSuccess: () => utils.favorite.list.invalidate() });

  // Determine the category filter from the URL query parameter
  let displayPosts = posts as any[];
  if (selectedCollection) {
    displayPosts = posts.filter((p: any) => p.collectionId === selectedCollection);
  } else {
    // Always sort by most recent first
    displayPosts = [...posts].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    if (category === "video") {
      displayPosts = displayPosts.filter((p: any) => p.mediaType === "video");
    } else if (category === "writing") {
      // Writing encompasses text/creation posts (no strict file type). We filter by type
      displayPosts = displayPosts.filter((p: any) => p.type === "thought" || p.type === "creation");
    }
  }

  // Load social links and King live status on mount and when the location changes.
  useEffect(() => {
    setSocialLinks(getSocialLinks().filter((s) => s.isActive && s.url));
    setKingLiveState(getKingLive());
  }, [location.search]);

  const typeColors: Record<string, string> = {
    thought: "bg-[rgba(139,134,128,0.15)] text-[#8b8680]",
    creation: "bg-[rgba(201,169,110,0.15)] text-[#c9a96e]",
    update: "bg-[rgba(76,175,147,0.15)] text-[#4caf93]",
  };

  return (
    <div className="min-h-screen pt-24 pb-16 relative" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[680px] mx-auto px-4">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-[#e8e6e3]">The Feed</h1>
          <p className="text-sm text-[#8b8680] mt-1">Browse everything by category.</p>
        </div>

        {/* Filter bar removed: categories are now selected via navigation links */}

        {collections.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {collections.map((c: any) => (
              <button key={c.id} onClick={() => setSelectedCollection(selectedCollection === c.id ? null : c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCollection === c.id ? "bg-[#4caf93] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680] hover:text-[#e8e6e3]"}`}>
                <FolderOpen className="w-3 h-3" /> {c.name}
              </button>
            ))}
          </div>
        )}

        <PollWidget />

        {/* If the King is live, show a banner at the top of the feed to alert fans */}
        {kingLive && (
          <div className="mb-6 p-4 rounded-xl border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.05)] flex items-center gap-3">
            <Broadcast className="w-5 h-5 text-[#c9a96e]" />
            <span className="text-sm text-[#e8e6e3]">The King is live! Join now.</span>
          </div>
        )}

        {isKing && (
          <div className="mb-6">
            {!showCreate ? (
              <button onClick={() => setShowCreate(true)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] hover:border-[rgba(201,169,110,0.2)] transition-all text-left">
                <div className="w-10 h-10 rounded-full bg-[rgba(201,169,110,0.1)] flex items-center justify-center"><Crown className="w-5 h-5 text-[#c9a96e]" /></div>
                <span className="text-sm text-[#8b8680]">What&apos;s on your mind, King?</span>
                <Plus className="w-5 h-5 text-[#c9a96e] ml-auto" />
              </button>
            ) : (
              <div className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.15)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg text-[#e8e6e3]">Create Post</h3>
                  <button onClick={() => setShowCreate(false)} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Post title..." />
                  <textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows={4} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] resize-none" placeholder="What's on your mind..." />
                  <div className="flex flex-wrap gap-2">
                    {(["none", "image", "video", "audio", "document"] as MediaType[]).map((mt) => (
                      <button key={mt} onClick={() => setNewPost({ ...newPost, mediaType: mt })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newPost.mediaType === mt ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#1a1d21] text-[#8b8680] hover:text-[#e8e6e3]"}`}>{mt !== "none" && MEDIA_ICONS[mt]} {mt === "none" ? "Text Only" : mt.charAt(0).toUpperCase() + mt.slice(1)}</button>
                    ))}
                  </div>
                  {newPost.mediaType !== "none" && (
                    <input type="text" value={newPost.mediaUrl || ""} onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder={`Paste ${newPost.mediaType} URL here...`} />
                  )}
                  <input type="text" value={newPost.downloadUrl || ""} onChange={(e) => setNewPost({ ...newPost, downloadUrl: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Download file URL (optional, for Fanatics)..." />
                  <div className="flex flex-wrap gap-2">
                    <select value={newPost.type} onChange={(e) => setNewPost({ ...newPost, type: e.target.value as any })} className="bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2 text-xs text-[#e8e6e3]"><option value="thought">Thought</option><option value="creation">Creation</option><option value="update">Update</option></select>
                {/* Post access tier: public or fanatic. 'Fanatic' posts are visible only to authenticated fans. */}
                <select value={newPost.tier} onChange={(e) => setNewPost({ ...newPost, tier: e.target.value as any })} className="bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2 text-xs text-[#e8e6e3]">
                  <option value="public">Public</option>
                  <option value="fanatic">Fanatic</option>
                </select>
                    <button onClick={() => createPost.mutate(newPost as any)} disabled={!newPost.title.trim() || !newPost.content.trim()} className="ml-auto px-5 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a] disabled:opacity-50">Publish</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isKing && isAuthenticated && !isFanatic && (
          // Non‑fanatic users see an informational notice instead of an upgrade prompt. This avoids
          // subscription‑style wording and directs them to their profile to become a Fanatic.
          <div className="mb-6 p-4 rounded-xl bg-[rgba(201,169,110,0.05)] border border-[rgba(201,169,110,0.15)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#c9a96e]" />
              <span className="text-sm text-[#e8e6e3]">
                This feature is reserved for <span className="text-[#c9a96e] font-medium">Fanatics</span>. Become a Fanatic in your profile settings to download content.
              </span>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="px-3 py-1.5 bg-[#c9a96e] text-[#1a1d21] text-xs font-medium rounded-lg hover:bg-[#d4b87a]"
            >
              Go to Profile
            </button>
          </div>
        )}

        {/* Posts listing (no merch). */}
        <div className="space-y-5">
          {displayPosts.length === 0 && <p className="text-sm text-[#8b8680] text-center py-8">No posts in this category yet.</p>}
          {displayPosts.map((post: any) => {
            const favorited = false;
            const commentsExpanded = expandedComments.has(post.id);
            // A post is exclusive if its tier is fanatic. We removed 'vip' and 'subscribers'.
            const isVIP = post.tier === "fanatic";
            return (
              <article key={post.id} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] overflow-hidden hover:border-[rgba(201,169,110,0.2)] transition-all">
                {post.mediaUrl && post.mediaType === "image" && (
                  <div className="aspect-video relative">
                    <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
                    {isVIP && <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] text-[#c9a96e] font-mono"><Lock className="w-3 h-3" /> FANATIC ONLY</div>}
                  </div>
                )}
                {post.mediaUrl && post.mediaType === "video" && (
                  <div className="aspect-video relative">
                    <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                    {isVIP && <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] text-[#c9a96e] font-mono"><Lock className="w-3 h-3" /> FANATIC ONLY</div>}
                  </div>
                )}
                {post.mediaUrl && post.mediaType === "audio" && (
                  <div className="p-4 bg-[#1a1d21]"><audio src={post.mediaUrl} controls className="w-full" /></div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase ${typeColors[post.type] || typeColors.thought}`}>{post.type}</span>
                    <span className="flex items-center gap-1 text-[10px] text-[#8b8680]"><Clock className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    {post.mediaType !== "none" && <span className="flex items-center gap-1 text-[10px] text-[#4caf93] bg-[rgba(76,175,147,0.1)] px-2 py-0.5 rounded">{MEDIA_ICONS[post.mediaType]} {post.mediaType}</span>}
                    {isVIP && <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(201,169,110,0.15)] text-[#c9a96e]"><Lock className="w-3 h-3" /> FANATIC ONLY</span>}
                    {post.tipCount > 0 && <span className="flex items-center gap-1 text-[10px] text-[#c9a96e] bg-[rgba(201,169,110,0.08)] px-2 py-0.5 rounded"><DollarSign className="w-3 h-3" /> {post.tipCount} tips</span>}
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-[#e8e6e3] mb-2">{post.title}</h2>
                  <p className="text-sm text-[#8b8680] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[rgba(201,169,110,0.08)]">
                    <button onClick={() => likeMut.mutate({ id: post.id })} className="flex items-center gap-1.5 text-sm text-[#8b8680] hover:text-[#c9a96e] transition-colors"><Heart className="w-4 h-4" /><span>{post.likes}</span></button>
                    <button onClick={() => setExpandedComments((prev) => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })} className="flex items-center gap-1.5 text-sm text-[#8b8680] hover:text-[#c9a96e] transition-colors"><MessageCircle className="w-4 h-4" /><span>Comments</span></button>
                    <button onClick={() => setTipPostId(post.id)} className="flex items-center gap-1.5 text-sm text-[#8b8680] hover:text-[#c9a96e] transition-colors"><DollarSign className="w-4 h-4" /><span>Tip</span></button>
                    {(post.mediaUrl || post.downloadUrl) && (
                      <button className={`ml-auto flex items-center gap-1.5 text-sm transition-colors ${isFanatic ? "text-[#c9a96e] hover:text-[#d4b87a]" : "text-[#8b8680] hover:text-[#c9a96e]"}`}>
                        <Download className="w-4 h-4" /><span>{isFanatic ? "Download" : "Fanatic Only"}</span>
                      </button>
                    )}
                  </div>
                  {commentsExpanded && <CommentSection postId={post.id} />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {tipPostId && (
        <TipModal
          postId={tipPostId}
          postTitle={(posts as any[]).find((p: any) => p.id === tipPostId)?.title || ""}
          onClose={() => setTipPostId(null)}
        />
      )}
      {/* Vertical social bar: display active social links along the left edge on larger screens */}
      {socialLinks.length > 0 && (
        <div className="hidden sm:flex flex-col items-center gap-3 fixed top-1/3 left-4 z-40">
          {socialLinks.map((link) => {
            const Icon = iconMap[link.platform] || XIcon;
            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] hover:bg-[#23262a] transition-colors"
              >
                <Icon className="w-4 h-4 text-[#c9a96e]" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}