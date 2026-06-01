
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router";
import {
  getScheduledPosts,
  getPosts,
  getAnalytics,
  getFans,
  getOrders,
  deletePost,
  editPost,
  getCollections,
  addCollection,
  getAutoLikeEnabled,
  setAutoLikeEnabled,
  getUnlikedComments,
  markCommentAutoLiked,
  getAutoLikedCount,
  addRecurringPost,
  type Post,
} from "@/lib/localDb";
import {
  Bot, Crown, Sparkles, Calendar, TrendingUp, Users, Clock,
  ArrowLeft, Zap, Image, Video, Music, PenLine,
  BarChart3, Lightbulb, Send, X, ChevronRight, Trash2,
  Target, RefreshCw, Star, ToggleLeft, ToggleRight, Heart,
} from "lucide-react";
import { toast } from "sonner";

/* ─── AI Chat Message ─── */
interface ChatMsg {
  id: number;
  role: "user" | "ai";
  content: string;
  actions?: { label: string; action: () => void }[];
}

/* ─── Generate AI Insights based on site data ─── */
function generateInsights(
  posts: Post[],
  analytics: ReturnType<typeof getAnalytics>,
  fanCount: number,
  orderCount: number
) {
  const insights: { title: string; message: string; icon: React.ReactNode; priority: "high" | "medium" | "low" }[] = [];

  // Post frequency insight
  const recentPosts = posts.filter((p) => new Date(p.createdAt).getTime() > Date.now() - 7 * 86400000);
  if (recentPosts.length < 2) {
    insights.push({
      title: "Post Frequency Low",
      message: "You haven't posted much this week. Fans engage more with consistent content. Aim for 3-5 posts per week to keep your audience active.",
      icon: <Clock className="w-4 h-4 text-[#c9a96e]" />,
      priority: "high",
    });
  } else if (recentPosts.length >= 5) {
    insights.push({
      title: "Great Posting Consistency",
      message: "Excellent work! You're posting regularly this week. Your fans are likely staying engaged. Consider turning your best posts into collections.",
      icon: <Star className="w-4 h-4 text-[#4caf93]" />,
      priority: "low",
    });
  }

  // Engagement insight
  const topPost = posts.reduce((best, p) => p.likes > best.likes ? p : best, posts[0]);
  if (topPost && topPost.likes > 50) {
    insights.push({
      title: "Viral Content Detected",
      message: `"${topPost.title}" is performing exceptionally well with ${topPost.likes} likes. Create follow-up content in the same style or theme to capitalize on this momentum.`,
      icon: <TrendingUp className="w-4 h-4 text-[#c9a96e]" />,
      priority: "high",
    });
  }

  // Content type insight
  const mediaPosts = posts.filter((p) => p.mediaType !== "none");
  const textPosts = posts.filter((p) => p.mediaType === "none");
  if (textPosts.length > mediaPosts.length * 2) {
    insights.push({
      title: "Add More Visual Content",
      message: "Most of your posts are text-only. Visual content (images, videos) typically gets 2-3x more engagement. Try adding media to your next few posts.",
      icon: <Image className="w-4 h-4 text-[#c9a96e]" />,
      priority: "medium",
    });
  }

  // Fan growth insight
  if (fanCount < 5) {
    insights.push({
      title: "Grow Your Fanbase",
      message: "You have fewer than 5 registered fans. Share your Digital Kingdom link on your social platforms and consider offering a free exclusive post to new signups.",
      icon: <Users className="w-4 h-4 text-[#c9a96e]" />,
      priority: "high",
    });
  }

  // Revenue insight
  if (orderCount === 0 && posts.length > 3) {
    insights.push({
      title: "Monetization Opportunity",
      message: "You have content but no shop sales yet. Consider adding a digital product (wallpaper pack, template, preset) at an affordable price point to start generating revenue.",
      icon: <Zap className="w-4 h-4 text-[#c9a96e]" />,
      priority: "medium",
    });
  }

  // Tip insight
  const totalTips = posts.reduce((s, p) => s + p.tipCount, 0);
  if (totalTips > 0) {
    const highestTipped = posts.reduce((best, p) => p.tips > best.tips ? p : best, posts[0]);
    insights.push({
      title: "Tipping Active",
      message: `Fans have tipped $${posts.reduce((s, p) => s + Number(p.tips), 0).toFixed(2)} total. Your highest-tipped post "${highestTipped.title}" resonates well. Pin a tip call-to-action on your next post.`,
      icon: <Target className="w-4 h-4 text-[#4caf93]" />,
      priority: "low",
    });
  }

  // Exclusive content insight
  // If the creator has not posted any Fanatic-only posts yet, encourage them to create some
  const fanaticPosts = posts.filter((p) => p.tier === "fanatic");
  if (fanaticPosts.length === 0 && posts.length > 2) {
    insights.push({
      title: "Create Fanatic Content",
      message:
        "You don't have any Fanatic-only posts yet. Creating exclusive posts gives your most dedicated fans something special and encourages deeper engagement.",
      icon: <Crown className="w-4 h-4 text-[#c9a96e]" />,
      priority: "high",
    });
  }

  return insights;
}

/* ─── Quick Actions ─── */
const QUICK_ACTIONS = [
  { label: "Analyze my content performance", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Suggest post ideas for this week", icon: <Lightbulb className="w-4 h-4" /> },
  { label: "How do I get more Fanatics?", icon: <Users className="w-4 h-4" /> },
  { label: "Best time to post?", icon: <Clock className="w-4 h-4" /> },
  { label: "Monetization strategies", icon: <Zap className="w-4 h-4" /> },
  { label: "Social media growth tips", icon: <TrendingUp className="w-4 h-4" /> },
];

/* ═══════════════════════════════════════════ */
export default function AIAgent() {
  const { isKing } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "schedule" | "insights">("chat");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [scheduled, setScheduled] = useState<Post[]>([]);
  const [insights, setInsights] = useState<ReturnType<typeof generateInsights>>([]);
  const [analytics, setAnalytics] = useState<ReturnType<typeof getAnalytics>>({ views: 0, fanSignups: 0, fanaticSignups: 0, totalRevenue: "0.00" });
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [autoLike, setAutoLike] = useState(getAutoLikeEnabled());
  const [autoLikedCount, setAutoLikedCount] = useState(0);

  useEffect(() => {
    if (!isKing) return;
    const posts = getPosts();
    const fans = getFans();
    const orders = getOrders();
    const anal = getAnalytics();
    setScheduled(getScheduledPosts());
    setInsights(generateInsights(posts, anal, fans.length, orders.length));
    setAnalytics(anal);
    setAutoLike(getAutoLikeEnabled());
    // Count how many comments have been auto-liked
    const likedCount = getAutoLikedCount();
    setAutoLikedCount(likedCount);

    // Welcome message
    setChatMessages([{
      id: Date.now(),
      role: "ai",
      content: `Welcome back, King! I'm your AI social manager. I can help you schedule posts, analyze your content performance, and suggest strategies to grow your audience and revenue.\n\nHere are some things I can do:\n• Schedule posts for optimal times\n• Analyze which content performs best\n• Suggest post ideas based on trends\n• Help you convert more fans to Fanatics\n• Provide monetization tips`,
    }]);
  }, [isKing]);

  if (!isKing) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center">
          <Crown className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#e8e6e3] mb-2">King Only</h2>
          <p className="text-sm text-[#8b8680]">The AI Agent is exclusive to the King account.</p>
        </div>
      </div>
    );
  }

  const handleAIResponse = (query: string) => {
    const posts = getPosts();
    const fans = getFans();
    const anal = getAnalytics();
    const orders = getOrders();
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
    const avgLikes = posts.length > 0 ? (totalLikes / posts.length).toFixed(1) : "0";
    const topPost = posts.reduce((best, p) => p.likes > best.likes ? p : best, posts[0]);
    const totalTips = posts.reduce((s, p) => s + Number(p.tips), 0);

    let response = "";

    // Attempt to detect and schedule recurring post commands. The AI Agent understands
    // phrases like "write a post every morning at 10 a.m. titled 'Good morning loyal subjects!' with a random motivational quote".
    // We'll extract the time, title, and whether to use a random quote as content. If a recurring post
    // schedule is created, we return a confirmation message and skip further analysis.
    try {
      const titleMatch = query.match(/(?:title|titled)\s+["']([^"']+)["']/i);
      // Regex to capture times like "10 a.m.", "7 pm", "08:30 am", etc.
      const timeMatch = query.match(/(\d{1,2})(?:[:\.](\d{2}))?\s*(a\.?m\.?|am|p\.?m\.?|pm)/i);
      const hasEvery = /every\s+(morning|day|afternoon|evening|night)/i.test(query) || /daily/i.test(query);
      if (titleMatch && (timeMatch || hasEvery)) {
        // Determine time string
        let hour = 10;
        let minute = 0;
        if (timeMatch) {
          hour = parseInt(timeMatch[1], 10);
          minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
          const period = timeMatch[3] ? timeMatch[3].toLowerCase() : "am";
          const isPM = period.includes("p");
          const isAM = period.includes("a");
          if (isPM && hour < 12) hour += 12;
          if (isAM && hour === 12) hour = 0;
        } else {
          // If no explicit time given, default to 10:00 AM for "every morning"
          if (/morning/i.test(query)) {
            hour = 10;
            minute = 0;
          }
        }
        const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const title = titleMatch[1];
        // Determine content: if the query mentions "random quote" or "motivational quote", leave content null
        const useRandom = /random\s+(motivational\s+)?quote/i.test(query);
        const content = useRandom ? null : null;
        // Create the recurring post schedule
        addRecurringPost({ title, content, time: timeStr });
        response = `Scheduled a recurring post titled "${title}" every day at ${timeStr}. It will include ${useRandom ? "a random motivational quote" : "your specified content"} each time.`;
        return response;
      }
    } catch (err) {
      /* If scheduling parsing fails, fall through to other responses */
    }
    const lower = query.toLowerCase();

    if (lower.includes("performance") || lower.includes("analyze")) {
      response = `Here's your content performance summary:\n\n**Total Posts:** ${posts.length}\n**Total Likes:** ${totalLikes} (avg ${avgLikes}/post)\n**Total Tips:** $${totalTips.toFixed(2)}\n**Top Post:** "${topPost?.title || "N/A"}" with ${topPost?.likes || 0} likes\n\n**Recommendation:** ${topPost ? `Your audience loves "${topPost.title}". Create more content in this style or theme.` : "Start posting to build engagement data."}`;
    } else if (lower.includes("idea") || lower.includes("suggest") || lower.includes("what should i post")) {
      const ideas = [
        "Behind-the-scenes of your creative process - fans love seeing how the magic happens",
        "A poll asking fans what they want to see next (use the polls feature!)",
        "A time-lapse video of your work in progress",
        "Q&A post - answer fan questions from your messages",
        "Sneak peek of upcoming exclusive content for Fanatics",
        "Share your toolkit - what software/hardware you use",
        "A throwback post showing your early work vs. now",
        "Collaboration announcement or shoutout to a fan",
      ];
      const shuffled = ideas.sort(() => Math.random() - 0.5).slice(0, 4);
      response = `Here are some post ideas for this week:\n\n${shuffled.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}\n\n**Pro tip:** Mix up your content types. Alternate between thoughts, creations, and updates to keep your feed dynamic.`;
  } else if (lower.includes("fanatic") || lower.includes("upgrade") || lower.includes("convert")) {
    // Encourage ways to convert regular fans to Fanatics without mentioning pricing or subscriptions
    response = `To encourage more fans to become Fanatics:\n\n1. **Create exclusive content** – Share behind‑the‑scenes posts, bonus clips, or extended versions that only Fanatics can access.\n2. **Offer downloads** – Attach downloadable items like wallpapers, templates, or audio files to posts; reserve these for Fanatics.\n3. **Priority messaging** – Let your community know that Fanatics get priority responses in messages and comments.\n4. **Preview & tease** – Share short previews of exclusive content on public posts to build anticipation.\n5. **Limited‑time rewards** – Offer special bonuses or shout‑outs for fans who become Fanatics during specific windows.\n\nYou currently have ${anal.fanaticSignups} Fanatic members.`;
    } else if (lower.includes("time") || lower.includes("when") || lower.includes("best time")) {
      response = `**Best posting times for creator content:**\n\n• **Tuesday - Thursday, 6-9 PM** (highest engagement window)\n• **Saturday mornings** (fans browse during weekend leisure time)\n• **Avoid:** Monday mornings and late Sunday nights (lowest activity)\n\nYou currently have ${posts.length} total posts. Consider scheduling your next post for Tuesday evening using the Schedule tab.`;
    } else if (lower.includes("money") || lower.includes("monetize") || lower.includes("revenue")) {
      response = `**Your Revenue Stats:**\n\n• Total Revenue: $${anal.totalRevenue}\n• Shop Orders: ${orders.length}\n• Tips Received: $${totalTips.toFixed(2)}\n\n**Monetization strategies:**\n\n1. **Digital products** - These have near-zero marginal cost. Consider: preset packs, templates, wallpapers, guides\n2. **Tiered pricing** - Offer a $5 quick product and a $50 premium product\n3. **Tips call-to-action** - End posts with "If this resonated with you, a tip helps me create more"\n4. **Bundle deals** - "Get 3 digital products for the price of 2"\n5. **Limited editions** - Scarcity drives sales. "Only 50 copies available"`;
    } else if (lower.includes("social") || lower.includes("growth") || lower.includes("traffic")) {
      response = `**Strategies to drive traffic to Digital Kingdom:**\n\n1. **Link in bio** - Put your Digital Kingdom URL in all your social bios (Instagram, TikTok, Twitter)\n2. **Teaser content** - Post previews on socials with "Full version on my Digital Kingdom"\n3. **Email list** - If you have one, send a weekly digest pointing to new Digital Kingdom posts\n4. **Cross-promote** - Mention your Digital Kingdom in YouTube video descriptions and Twitch panels\n5. **Referral program** - Encourage fans to share their referral links (they get rewards!)\n6. **SEO** - Use descriptive post titles that people might search for\n\nYour page has been viewed ${anal.views} times with ${anal.fanSignups} fan signups.`;
    } else {
      response = `That's a great question! Based on your current stats:\n\n• ${posts.length} posts total\n• ${totalLikes} total likes\n• $${anal.totalRevenue} in revenue\n• ${fans.length} registered fans\n\nI'd recommend focusing on consistent content creation and engaging with your community through comments and messages. Your fans are your biggest growth engine - reply to their comments, ask for their input via polls, and make them feel valued.\n\nIs there a specific area you'd like me to dive deeper into?`;
    }

    return response;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const userMsg: ChatMsg = { id: Date.now(), role: "user", content: inputValue };
    const aiResponse = handleAIResponse(inputValue);
    const aiMsg: ChatMsg = { id: Date.now() + 1, role: "ai", content: aiResponse };
    setChatMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputValue("");
  };

  const handleQuickAction = (label: string) => {
    const userMsg: ChatMsg = { id: Date.now(), role: "user", content: label };
    const aiResponse = handleAIResponse(label);
    const aiMsg: ChatMsg = { id: Date.now() + 1, role: "ai", content: aiResponse };
    setChatMessages((prev) => [...prev, userMsg, aiMsg]);
  };

  const handleToggleAutoLike = () => {
    const next = !autoLike;
    setAutoLike(next);
    setAutoLikeEnabled(next);
    if (next) {
      // Auto-like all existing unliked comments
      const unliked = getUnlikedComments();
      let count = 0;
      for (const comment of unliked) {
        markCommentAutoLiked(comment.id);
        count++;
      }
      setAutoLikedCount((prev) => prev + count);
      toast.success(`Auto-like enabled! AI liked ${count} existing comment${count !== 1 ? "s" : ""}.`);
    } else {
      toast.success("Auto-like disabled.");
    }
  };

  const handleCreateCollection = () => {
    if (!collectionName.trim()) return;
    addCollection({ name: collectionName.trim(), description: "", coverImage: null });
    toast.success(`Collection "${collectionName}" created!`);
    setCollectionName("");
    setShowNewCollection(false);
  };

  const handleDeleteScheduled = (postId: number) => {
    deletePost(postId);
    setScheduled(getScheduledPosts());
    toast.success("Scheduled post deleted");
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[1000px] mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-[#8b8680] hover:text-[#c9a96e] mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" /> King Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(201,169,110,0.1)] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#c9a96e]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#e8e6e3]">AI Social Manager</h1>
              <p className="text-sm text-[#8b8680]">Your personal assistant for content strategy and growth.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["chat", "schedule", "insights"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680] hover:text-[#e8e6e3]"}`}>
              {tab === "chat" && <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === "schedule" && <Calendar className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === "insights" && <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-2">
              <div className="bg-[#23262a] rounded-xl border border-[rgba(201,169,110,0.08)] flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.role === "ai" && (
                        <div className="w-8 h-8 rounded-lg bg-[rgba(201,169,110,0.1)] flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-[#c9a96e]" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#1a1d21] text-[#e8e6e3]"}`}>
                        {msg.content.split("\n").map((line, i) => {
                          if (line.startsWith("**") && line.endsWith("**")) {
                            return <p key={i} className="font-semibold mt-2 mb-1">{line.replace(/\*\*/g, "")}</p>;
                          }
                          if (line.match(/^\d+\./)) {
                            return <p key={i} className="ml-2 mb-0.5">{line}</p>;
                          }
                          if (line.startsWith("•")) {
                            return <p key={i} className="ml-2 mb-0.5 text-[#8b8680]">{line}</p>;
                          }
                          return line ? <p key={i} className="mb-0.5">{line}</p> : <br key={i} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[rgba(201,169,110,0.08)]">
                  <div className="flex gap-2">
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                      placeholder="Ask your AI assistant..." />
                    <button onClick={handleSendMessage} className="p-2.5 bg-[#c9a96e] text-[#1a1d21] rounded-lg hover:bg-[#d4b87a] transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Like Toggle */}
            <div className="mb-5 p-3 rounded-lg bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${autoLike ? "text-[#c94a4a]" : "text-[#8b8680]"}`} />
                  <div>
                    <p className="text-xs font-medium text-[#e8e6e3]">Auto-Like Comments</p>
                    <p className="text-[10px] text-[#8b8680]">{autoLike ? `${autoLikedCount} comments liked` : "Off"}</p>
                  </div>
                </div>
                <button onClick={handleToggleAutoLike} className={`p-1.5 rounded-lg transition-all ${autoLike ? "text-[#4caf93]" : "text-[#8b8680]"}`}>
                  {autoLike ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-medium text-[#e8e6e3] mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.label} onClick={() => handleQuickAction(action.label)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#23262a] border border-[rgba(201,169,110,0.06)] hover:border-[rgba(201,169,110,0.2)] text-left transition-all text-[#8b8680] hover:text-[#e8e6e3]">
                    <span className="text-[#c9a96e]">{action.icon}</span>
                    <span className="text-xs font-medium">{action.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[#e8e6e3]">Scheduled Posts</h2>
              <span className="text-xs text-[#8b8680] font-mono">{scheduled.length} pending</span>
            </div>

            {scheduled.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                <Calendar className="w-10 h-10 text-[#3a3d42] mx-auto mb-3" />
                <p className="text-sm text-[#8b8680]">No scheduled posts.</p>
                <p className="text-xs text-[#8b8680] mt-1">Create a post from the Feed and schedule it for later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduled.map((post) => (
                  <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(201,169,110,0.1)] flex items-center justify-center">
                      {post.mediaType === "image" ? <Image className="w-5 h-5 text-[#c9a96e]" /> :
                       post.mediaType === "video" ? <Video className="w-5 h-5 text-[#c9a96e]" /> :
                       post.mediaType === "audio" ? <Music className="w-5 h-5 text-[#c9a96e]" /> :
                       <PenLine className="w-5 h-5 text-[#c9a96e]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e8e6e3] truncate">{post.title}</p>
                      <p className="text-xs text-[#8b8680] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Scheduled for: {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : "TBD"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { editPost(post.id, { scheduledFor: null }); setScheduled(getScheduledPosts()); toast.success("Post published now!"); }}
                        className="p-2 text-[#4caf93] hover:bg-[rgba(76,175,147,0.1)] rounded-lg transition-colors" title="Publish now">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteScheduled(post.id)}
                        className="p-2 text-[#c94a4a] hover:bg-[rgba(201,74,74,0.1)] rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collections Manager */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-semibold text-[#e8e6e3]">Collections</h2>
                <button onClick={() => setShowNewCollection(!showNewCollection)} className="text-xs text-[#c9a96e] hover:text-[#d4b87a]">
                  {showNewCollection ? "Cancel" : "+ New Collection"}
                </button>
              </div>
              {showNewCollection && (
                <div className="flex gap-2 mb-4">
                  <input type="text" value={collectionName} onChange={(e) => setCollectionName(e.target.value)}
                    className="flex-1 bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                    placeholder="Collection name..." />
                  <button onClick={handleCreateCollection} className="px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]">Create</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getCollections().map((col) => (
                  <div key={col.id} className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                    <p className="text-sm font-medium text-[#e8e6e3]">{col.name}</p>
                    <p className="text-xs text-[#8b8680] mt-1">{col.description || "No description"}</p>
                    <p className="text-[10px] text-[#8b8680] font-mono mt-2">{getPosts().filter((p) => p.collectionId === col.id).length} posts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] text-center">
                <Users className="w-5 h-5 text-[#c9a96e] mx-auto mb-2" />
                <p className="font-mono text-2xl text-[#e8e6e3] font-bold">{analytics.views}</p>
                <p className="text-[10px] text-[#8b8680] uppercase tracking-wider">Page Views</p>
              </div>
              <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] text-center">
                <Users className="w-5 h-5 text-[#4caf93] mx-auto mb-2" />
                <p className="font-mono text-2xl text-[#e8e6e3] font-bold">{analytics.fanSignups}</p>
                <p className="text-[10px] text-[#8b8680] uppercase tracking-wider">Fan Signups</p>
              </div>
              <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] text-center">
                <Star className="w-5 h-5 text-[#c9a96e] mx-auto mb-2" />
                <p className="font-mono text-2xl text-[#e8e6e3] font-bold">{analytics.fanaticSignups}</p>
                <p className="text-[10px] text-[#8b8680] uppercase tracking-wider">Fanatics</p>
              </div>
              <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] text-center">
                <Zap className="w-5 h-5 text-[#c9a96e] mx-auto mb-2" />
                <p className="font-mono text-2xl text-[#c9a96e] font-bold">${analytics.totalRevenue}</p>
                <p className="text-[10px] text-[#8b8680] uppercase tracking-wider">Revenue</p>
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#e8e6e3] mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#c9a96e]" /> AI Recommendations
              </h2>
              {insights.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                  <Sparkles className="w-8 h-8 text-[#3a3d42] mx-auto mb-2" />
                  <p className="text-sm text-[#8b8680]">Not enough data for insights yet. Start posting!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${insight.priority === "high" ? "bg-[rgba(201,169,110,0.05)] border-[rgba(201,169,110,0.2)]" : "bg-[#23262a] border-[rgba(201,169,110,0.08)]"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {insight.icon}
                        <p className="text-sm font-medium text-[#e8e6e3]">{insight.title}</p>
                        {insight.priority === "high" && <span className="ml-auto text-[10px] font-mono bg-[rgba(201,169,110,0.15)] text-[#c9a96e] px-2 py-0.5 rounded">HIGH</span>}
                      </div>
                      <p className="text-xs text-[#8b8680] leading-relaxed">{insight.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}