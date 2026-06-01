// ============================================================
// Local tRPC Handler - routes all tRPC calls to localStorage
// ============================================================
// This replaces the HTTP backend for static deployments.
// Every tRPC procedure is mapped to a localDb function.

import {
  getPosts, addPost, editPost, deletePost, getPostById,
  getProducts, addProduct, editProduct, deleteProduct, getProductById,
  getOrders, createOrder, updateOrderStatus,
  getCollections, addCollection, deleteCollection,
  getComments, addComment,
  getPolls, addPoll, votePoll, deletePoll,
  getStories, addStory, deleteStory,
  getSocialLinks,
  getFavorites, toggleFavorite,
  getTips, createTip,
  getWallet, addToWallet, requestWithdrawal, completeWithdrawal,
  getActiveSales, createSale, deleteSale,
  getSiteSettings, updateSiteSettings,
  getMessages, sendMessage, getConversation, markConversationRead,
  getFans, updateFanProfile,
  getAnalytics,
  recordDownload,
} from "./localDb";

// Route a tRPC call to the appropriate localDb function
export async function handleLocalTrpc(
  path: string,
  input: any,
  type: "query" | "mutation"
): Promise<any> {
  // ========== POST ==========
  if (path === "post.list") {
    let posts = getPosts();
    // Sort by createdAt desc
    posts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (input?.type) posts = posts.filter((p) => p.type === input.type);
    if (input?.tier) posts = posts.filter((p) => p.tier === input.tier);
    return posts;
  }
  if (path === "post.getById") return getPostById(input?.id) ?? null;
  if (path === "post.create") {
    const p = addPost({
      title: input.title,
      content: input.content,
      type: input.type ?? "thought",
      tier: input.tier ?? "public",
      mediaUrl: input.mediaUrl ?? null,
    });
    return { id: p.id };
  }
  if (path === "post.update") {
    const { id, ...data } = input;
    editPost(id, data);
    return { success: true };
  }
  if (path === "post.delete") {
    deletePost(input.id);
    return { success: true };
  }
  if (path === "post.like") {
    const post = getPostById(input.id);
    if (post) editPost(input.id, { likes: (post.likes || 0) + 1 });
    return { success: true };
  }

  // ========== PRODUCT ==========
  if (path === "product.list") {
    return getProducts()
      .filter((p) => p.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (path === "product.getById") return getProductById(input?.id) ?? null;
  if (path === "product.create") {
    const p = addProduct({
      name: input.name,
      description: input.description,
      price: String(input.price),
      imageUrl: input.imageUrl ?? null,
      category: input.category ?? "digital",
    });
    return { id: p.id };
  }
  if (path === "product.update") {
    const { id, ...data } = input;
    if (data.price !== undefined) data.price = String(data.price);
    editProduct(id, data);
    return { success: true };
  }
  if (path === "product.delete") {
    deleteProduct(input.id);
    return { success: true };
  }

  // ========== COLLECTION ==========
  if (path === "collection.list") return getCollections();
  if (path === "collection.create") {
    const c = addCollection({ name: input.name, description: input.description, coverImage: input.coverImage });
    return { id: c.id };
  }
  if (path === "collection.delete") {
    deleteCollection(input.id);
    return { success: true };
  }
  if (path === "collection.posts") {
    return getPosts().filter((p) => p.collectionId === input.collectionId);
  }

  // ========== COMMENT ==========
  if (path === "comment.list") {
    return getComments()
      .filter((c) => c.postId === input.postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  if (path === "comment.create") {
    const c = addComment(input);
    return { id: c.id };
  }
  if (path === "comment.delete") return { success: true };

  // ========== POLL ==========
  if (path === "poll.list") return getPolls();
  if (path === "poll.create") {
    const p = addPoll({ question: input.question, options: input.options });
    return { id: p.id };
  }
  if (path === "poll.vote") {
    votePoll(input.id, input.optionIndex, input.userId);
    return { success: true };
  }
  if (path === "poll.delete") {
    deletePoll(input.id);
    return { success: true };
  }

  // ========== FAVORITE ==========
  if (path === "favorite.list") return getFavorites().filter((f) => f.userId === input.userId);
  if (path === "favorite.toggle") return toggleFavorite(input.userId, input.postId);

  // ========== TIP ==========
  if (path === "tip.list") return getTips();
  if (path === "tip.create") {
    createTip(input);
    return { success: true };
  }

  // ========== WALLET ==========
  if (path === "wallet.balance") return getWallet();
  if (path === "wallet.add") {
    addToWallet(input);
    return { success: true };
  }
  if (path === "wallet.withdraw") {
    const ok = requestWithdrawal(input.amount);
    return { success: ok };
  }
  if (path === "wallet.completeWithdrawal") {
    completeWithdrawal(input.id);
    return { success: true };
  }

  // ========== SALE ==========
  if (path === "sale.listActive") return getActiveSales();
  if (path === "sale.create") {
    const s = createSale(input);
    return { id: s.id };
  }
  if (path === "sale.delete") {
    deleteSale(input.id);
    return { success: true };
  }

  // ========== ORDER ==========
  if (path === "order.list") {
    const orders = getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (input?.userId) return orders.filter((o) => o.userId === input.userId);
    return orders;
  }
  if (path === "order.create") {
    const o = createOrder(input);
    return { id: o.id };
  }
  if (path === "order.updateStatus") {
    updateOrderStatus(input.id, input.status);
    return { success: true };
  }

  // ========== SETTING ==========
  if (path === "setting.getAll") {
    const s = getSiteSettings();
    return {
      siteTitle: s.siteTitle,
      tagline: s.tagline,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      heroCtaText: s.heroCtaText,
      accentColor: s.accentColor,
    };
  }
  if (path === "setting.get") {
    const s = getSiteSettings();
    return s[input.key as keyof typeof s] ?? "";
  }
  if (path === "setting.set") {
    updateSiteSettings({ [input.key]: input.value });
    return { success: true };
  }

  // ========== STORY ==========
  if (path === "story.list") {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return getStories()
      .filter((s) => new Date(s.createdAt).getTime() > dayAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (path === "story.create") {
    const s = addStory(input);
    return { id: s.id };
  }
  if (path === "story.delete") {
    deleteStory(input.id);
    return { success: true };
  }

  // ========== SOCIAL ==========
  if (path === "social.list") return getSocialLinks();

  // ========== MESSAGE ==========
  if (path === "message.listByFan") {
    return getMessages()
      .filter((m) => m.senderId === input.fanId || m.receiverId === input.fanId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (path === "message.conversation") return getConversation(input.userA, input.userB);
  if (path === "message.send") {
    const m = sendMessage(input.content, input.senderId, input.senderName, input.senderTier ?? "fan", input.receiverId);
    return { id: m.id };
  }
  if (path === "message.markRead") {
    markConversationRead(input.fanId);
    return { success: true };
  }
  if (path === "message.unreadForKing") return getMessages().filter((m) => m.receiverId === "king" && !m.isRead);
  if (path === "message.unreadForFan") return getMessages().filter((m) => m.receiverId === input.fanId && !m.isRead);

  // ========== FAN ==========
  if (path === "fan.list") return getFans();
  if (path === "fan.update") {
    updateFanProfile(input.username ?? input.id, input);
    return { success: true };
  }

  // ========== PING ==========
  if (path === "ping") return { ok: true, ts: Date.now() };

  // Unknown path - return empty
  console.warn(`[localTrpc] Unhandled path: ${path}`, input);
  return type === "query" ? [] : { success: true };
}
