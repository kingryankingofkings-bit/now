// ============================================================
// Digital Kingdom - Complete localStorage Database Layer
// ============================================================

// --- TYPES ---

export type MediaType = "image" | "video" | "audio" | "document" | "none";
// A fan can be on the free tier or the fanatic tier. We still keep the
// underlying values for backwards compatibility, but in the UI we label
// both tiers as "Fanatic". No subscription or paid membership wording
// remains.
export type FanTier = "fan" | "fanatic";
export type PostType = "thought" | "creation" | "update";
// Post access tier. Public posts are visible to everyone. Fanatic posts
// are visible only to authenticated fan accounts. We removed the
// subscribers and VIP nomenclature to avoid subscription/premium wording.
export type PostTier = "public" | "fanatic";
export type Category = "digital" | "physical" | "merch" | "exclusive";
export type OrderStatus = "pending" | "completed" | "cancelled";
export type DiscountPercent = 10 | 20 | 50;

export interface Post {
  id: number;
  title: string;
  content: string;
  type: PostType;
  tier: PostTier;
  mediaType: MediaType;
  mediaUrl: string | null;
  downloadUrl: string | null;
  collectionId: number | null;
  likes: number;
  tips: string;
  tipCount: number;
  scheduledFor: string | null;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  category: Category;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: string;
  userName: string;
  productId: number;
  productName: string;
  quantity: number;
  totalPrice: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: string;
  senderName: string;
  senderTier: FanTier;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Fan {
  id: number;
  username: string;
  passwordHash: string;
  displayName: string;
  email: string;
  phone: string;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  tier: FanTier;
  referralCode: string;
  totalSpent: string;
  createdAt: string;
  /**
   * Fanatic Static points accrued from interactions, purchases and donations.
   * Points never expire and start at 0 for new fans. The points can be
   * redeemed for discount codes via the redemption functions below.
   */
  staticPoints?: number;
}

export interface Comment {
  id: number;
  postId: number;
  authorId: string;
  authorName: string;
  authorTier: FanTier;
  content: string;
  createdAt: string;
}

export interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: Record<number, number>;
  votedBy: string[];
  createdAt: string;
}

export interface Story {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
}

export interface Sale {
  id: number;
  name: string;
  discountPercent: number;
  productIds: number[];
  expiresAt: string;
  createdAt: string;
}

export interface Tip {
  id: number;
  postId: number;
  fromId: string;
  fromName: string;
  amount: string;
  createdAt: string;
}

export interface WalletEntry {
  id: number;
  type: "donation" | "order" | "tip";
  amount: string;
  description: string | null;
  fromName: string | null;
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  amount: string;
  status: "pending" | "completed";
  createdAt: string;
}

export interface Wallet {
  balance: string;
  entries: WalletEntry[];
  withdrawals: Withdrawal[];
}

// --- Recurring Posts ---

// Recurring posts allow the AI Agent to automatically create text-only posts
// at a specified time each day. For example, the King can schedule a daily
// "Good morning loyal subjects!" post at 10:00 with a random motivational
// quote. Each recurring post tracks the last date it was posted to prevent
// duplicate posts on the same day.
export interface RecurringPost {
  id: number;
  title: string;
  // Optional static content. If null, the post will be populated with a
  // random motivational quote when created.
  content: string | null;
  // 24‑hour time string (e.g., "10:00" for 10 a.m.). The scheduler runs
  // once per minute and will create the post when the current time is
  // greater than or equal to this time and a post hasn’t been created
  // today yet.
  time: string;
  // Date the post was last created (YYYY‑MM‑DD). Used to avoid creating
  // multiple posts in one day.
  lastPostedDate: string | null;
  createdAt: string;
}

// Random motivational quotes pool. Feel free to expand this list. These are
// used when a recurring post’s content is null; the scheduler selects one
// at random.
const MOTIVATIONAL_QUOTES = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Every morning is a new opportunity to grow and be better than yesterday.",
  "You have the power to create change—start with yourself.",
  "Greatness begins with a single act of courage.",
  "Dream big, work hard, stay focused, and surround yourself with good people.",
  "Believe you can and you're halfway there.",
  "Your only limit is your mind—be limitless today.",
];

// Storage key for recurring posts
const KEY_RECURRING_POSTS = "recurringPosts";

// Retrieve all recurring posts
export function getRecurringPosts(): RecurringPost[] {
  return getItem<RecurringPost[]>(KEY_RECURRING_POSTS, []);
}

// Add a new recurring post schedule
export function addRecurringPost(data: Omit<RecurringPost, "id" | "createdAt" | "lastPostedDate"> & { lastPostedDate?: string | null }): RecurringPost {
  const recurs = getRecurringPosts();
  const rec: RecurringPost = {
    id: nextId(),
    title: data.title,
    content: data.content ?? null,
    time: data.time,
    lastPostedDate: data.lastPostedDate ?? null,
    createdAt: getNow(),
  };
  recurs.push(rec);
  setItem(KEY_RECURRING_POSTS, recurs);
  return rec;
}

// Delete a recurring post schedule by id
export function deleteRecurringPost(id: number): void {
  const recurs = getRecurringPosts();
  setItem(KEY_RECURRING_POSTS, removeById(recurs, id));
}

// Helper to generate a random motivational quote
function randomQuote(): string {
  const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[idx];
}

// Scheduler: check recurring posts and create posts when due
export function runRecurringPostScheduler(): void {
  const recurs = getRecurringPosts();
  if (recurs.length === 0) return;
  const now = new Date();
  // Current date (YYYY‑MM‑DD) and time (HH:MM)
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().substring(0, 5);
  let updated = false;
  const postsToCreate: { title: string; content: string }[] = [];
  for (const rec of recurs) {
    // Skip if already posted today
    if (rec.lastPostedDate === today) continue;
    // If current time is later than or equal to schedule time
    if (currentTime >= rec.time) {
      const content = rec.content ?? randomQuote();
      postsToCreate.push({ title: rec.title, content });
      // Update lastPostedDate
      rec.lastPostedDate = today;
      updated = true;
    }
  }
  if (updated) {
    // Persist updated recurring posts
    setItem(KEY_RECURRING_POSTS, recurs);
  }
  // Create the posts after updating local storage
  for (const p of postsToCreate) {
    addPost({
      title: p.title,
      content: p.content,
      type: "thought",
      tier: "public",
      mediaType: "none",
      mediaUrl: null,
      downloadUrl: null,
      scheduledFor: null,
    });
  }
}

export interface Favorite {
  id: number;
  userId: string;
  postId: number;
}

export interface Download {
  id: number;
  userId: string;
  postId: number;
  postTitle: string;
  downloadUrl: string;
  createdAt: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  displayName: string | null;
  icon: string | null;
  isActive: boolean;
}

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  accentColor: string;
}

export interface ContentPrefs {
  feedSort: "recent" | "liked" | "video" | "audio" | "writing" | "update";
  hideMerch: boolean;
  hideUpdates: boolean;
}

export interface NotifPrefs {
  newPosts: boolean;
  newVideos: boolean;
  newImages: boolean;
  newAudio: boolean;
  newWriting: boolean;
  newProducts: boolean;
  newPolls: boolean;
  mentions: boolean;
  tips: boolean;
}

export interface LeaderboardEntry {
  username: string;
  name: string;
  tier: FanTier;
  totalSpent: string;
}

export interface FanConversation {
  fanId: string;
  fanName: string;
  fanTier: FanTier;
  messages: Message[];
  lastMessage: Message;
  unread: number;
}

export interface Analytics {
  views: number;
  fanSignups: number;
  fanaticSignups: number;
  totalRevenue: string;
}

export interface PaymentMethod {
  cardholderName: string;
  cardNumber: string; // stored as last-4 only e.g. "**** **** **** 4242"
  expiry: string; // MM/YY
  cvv: string; // stored masked "***"
}

export interface Donation {
  id: number;
  fanId: string;
  fanName: string;
  amount: string;
  createdAt: string;
}

export interface RewardCode {
  code: string;        // e.g. "DK-7A3F9E"
  discountPercent: number;
  scope: "one_item" | "entire_order";
  used: boolean;
  createdAt: string;
  donationAmount: string;

  /**
   * Optional expiry date (ISO string). Codes generated from donations never expire,
   * while codes awarded via leaderboard or high‑tier static point redemptions may
   * include an expiry one week from creation.
   */
  expiresAt?: string | null;

  /**
   * Reason the code was generated (e.g. "donation", "referral", "static", "leaderboard").
   * This helps with analytics and filtering.
   */
  reason?: string;
}

// --- localStorage KEYS ---

const KEYS = {
  posts: "ch_posts",
  products: "ch_products",
  orders: "ch_orders",
  messages: "ch_messages",
  fans: "ch_fans",
  comments: "ch_comments",
  polls: "ch_polls",
  stories: "ch_stories",
  collections: "ch_collections",
  sales: "ch_sales",
  tips: "ch_tips",
  wallet: "ch_wallet",
  favorites: "ch_favorites",
  downloads: "ch_downloads",
  socialLinks: "ch_social_links",
  siteSettings: "ch_site_settings",
  contentPrefs: "ch_content_prefs",
  notifPrefs: "ch_notif_prefs",
  analytics: "ch_analytics",
  theme: "ch_theme",
  autoLike: "ch_auto_like",
  autoLikedComments: "ch_autoliked_comments",
  idCounter: "ch_id_counter",
  // Mapping of fan usernames to their Static Points balance. Points accrue from
  // interactions, purchases and donations, and never expire.
  staticPoints: "ch_static_points",

  // Mapping of generated referral invite codes to the inviter's fan username. Used
  // to award referral rewards when someone signs up using the invite code.
  referralInvites: "ch_referral_invites",

  // Flag to indicate whether the King is currently live streaming via the
  // "Make an appearance" feature. Stored as a stringified boolean.
  kingLive: "ch_king_live",
  /**
   * Mapping of fan usernames to the amount of Static Points they've earned. For example:
   * { "fan123": 150, "superfan": 520 }
   */
  staticPoints: "ch_static_points",

  /**
   * Mapping of referral codes to the inviter's fan username. When a new fan
   * registers using a referral code, both parties receive a reward code. This
   * store helps track which fan should be credited.
   */
  referralInvites: "ch_referral_invites",
  paymentMethod: "mdk2_payment_method",
  donations: "mdk2_donations",
  rewardCodes: "mdk2_reward_codes",
  // Last timestamp when the leaderboard rewards were distributed. Used by the
  // leaderboard scheduler to ensure rewards are only given every 2 weeks.
  leaderboardLastUpdate: "ch_leaderboard_last_update",
} as const;

// --- Helpers ---

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getNow(): string {
  return new Date().toISOString();
}

function nextId(): number {
  const current = getItem<number>(KEYS.idCounter, 0);
  const next = current + 1;
  setItem(KEYS.idCounter, next);
  return next;
}

function removeById<T extends { id: number }>(items: T[], id: number): T[] {
  return items.filter((i) => i.id !== id);
}

function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find((i) => i.id === id);
}

function updateById<T extends { id: number }>(items: T[], id: number, patch: Partial<T>): T[] {
  return items.map((i) => (i.id === id ? { ...i, ...patch } : i));
}

// --- Posts ---

export function getPosts(): Post[] {
  return getItem<Post[]>(KEYS.posts, []);
}

export function addPost(data: Partial<Post>): Post {
  const posts = getPosts();
  const post: Post = {
    id: nextId(),
    title: data.title ?? "Untitled",
    content: data.content ?? "",
    type: data.type ?? "thought",
    tier: data.tier ?? "public",
    mediaType: data.mediaType ?? "none",
    mediaUrl: data.mediaUrl ?? null,
    downloadUrl: data.downloadUrl ?? null,
    collectionId: data.collectionId ?? null,
    likes: data.likes ?? 0,
    tips: data.tips ?? "0",
    tipCount: data.tipCount ?? 0,
    scheduledFor: data.scheduledFor ?? null,
    createdAt: data.createdAt ?? getNow(),
  };
  posts.unshift(post);
  setItem(KEYS.posts, posts);
  return post;
}

export function editPost(id: number, data: Partial<Post>): void {
  const posts = getPosts();
  const updated = updateById(posts, id, data);
  setItem(KEYS.posts, updated);
}

export function deletePost(id: number): void {
  const posts = getPosts();
  setItem(KEYS.posts, removeById(posts, id));
}

export function getPostById(id: number): Post | undefined {
  return findById(getPosts(), id);
}

export function getScheduledPosts(): Post[] {
  const now = Date.now();
  return getPosts().filter(
    (p) => p.scheduledFor && new Date(p.scheduledFor).getTime() > now
  );
}

// --- Products ---

export function getProducts(): Product[] {
  return getItem<Product[]>(KEYS.products, []);
}

export function addProduct(data: Partial<Product>): Product {
  const products = getProducts();
  const product: Product = {
    id: nextId(),
    name: data.name ?? "New Product",
    description: data.description ?? "",
    price: data.price ?? "0",
    imageUrl: data.imageUrl ?? null,
    category: data.category ?? "digital",
    isActive: data.isActive ?? true,
    createdAt: data.createdAt ?? getNow(),
  };
  products.unshift(product);
  setItem(KEYS.products, products);
  return product;
}

export function editProduct(id: number, data: Partial<Product>): void {
  const products = getProducts();
  setItem(KEYS.products, updateById(products, id, data));
}

export function deleteProduct(id: number): void {
  const products = getProducts();
  setItem(KEYS.products, removeById(products, id));
}

export function getProductById(id: number): Product | undefined {
  return findById(getProducts(), id);
}

// --- Orders ---

export function getOrders(): Order[] {
  return getItem<Order[]>(KEYS.orders, []);
}

export function createOrder(data: Omit<Order, "id" | "createdAt">): Order {
  const orders = getOrders();
  const order: Order = {
    ...data,
    id: nextId(),
    createdAt: getNow(),
  };
  orders.unshift(order);
  setItem(KEYS.orders, orders);

  // Add to wallet
  addToWallet({
    type: "order",
    amount: data.totalPrice,
    description: `Order: ${data.productName} x${data.quantity}`,
    fromName: data.userName,
  });

  // Track revenue in analytics
  const analytics = getAnalytics();
  const revenue = parseFloat(analytics.totalRevenue) + parseFloat(data.totalPrice);
  setItem(KEYS.analytics, { ...analytics, totalRevenue: revenue.toFixed(2) });

  // Award Static Points: 10 points for every $5 spent
  try {
    const amount = parseFloat(data.totalPrice);
    if (!isNaN(amount) && amount > 0) {
      const points = Math.floor(amount / 5) * 10;
      if (points > 0) {
        addStaticPoints(data.userId, points);
      }
    }
  } catch {}

  return order;
}

export function updateOrderStatus(id: number, status: OrderStatus): void {
  const orders = getOrders();
  setItem(KEYS.orders, updateById(orders, id, { status }));
}

export function getOrdersByUser(userId: string): Order[] {
  return getOrders().filter((o) => o.userId === userId);
}

// --- Messages ---

export function getMessages(): Message[] {
  return getItem<Message[]>(KEYS.messages, []);
}

export function sendMessage(
  content: string,
  senderId: string,
  senderName: string,
  senderTier: FanTier,
  receiverId: string
): Message {
  const messages = getMessages();
  const message: Message = {
    id: nextId(),
    senderId,
    senderName,
    senderTier,
    receiverId,
    content,
    isRead: false,
    createdAt: getNow(),
  };
  messages.push(message);
  setItem(KEYS.messages, messages);
  return message;
}

export function getConversation(userA: string, userB: string): Message[] {
  return getMessages()
    .filter(
      (m) =>
        (m.senderId === userA && m.receiverId === userB) ||
        (m.senderId === userB && m.receiverId === userA)
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getFanConversations(): FanConversation[] {
  const messages = getMessages();
  const fans = getFans();
  const fanMap = new Map<string, Fan>();
  fans.forEach((f) => fanMap.set(f.username, f));

  const convoMap = new Map<string, Message[]>();

  messages.forEach((msg) => {
    const otherId = msg.senderId === "king" ? msg.receiverId : msg.senderId;
    if (!convoMap.has(otherId)) convoMap.set(otherId, []);
    convoMap.get(otherId)!.push(msg);
  });

  const conversations: FanConversation[] = [];

  convoMap.forEach((msgs, fanId) => {
    const sorted = msgs.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const lastMessage = sorted[sorted.length - 1];
    const unread = sorted.filter(
      (m) => m.receiverId === "king" && !m.isRead
    ).length;
    const fan = fanMap.get(fanId);

    conversations.push({
      fanId,
      fanName: fan?.displayName ?? fanId,
      fanTier: fan?.tier ?? "fan",
      messages: sorted,
      lastMessage,
      unread,
    });
  });

  // Sort by most recent message
  return conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime()
  );
}

export function markConversationRead(fanId: string): void {
  const messages = getMessages().map((m) => {
    if (m.senderId === fanId && m.receiverId === "king" && !m.isRead) {
      return { ...m, isRead: true };
    }
    return m;
  });
  setItem(KEYS.messages, messages);
}

// --- Fans (Authentication) ---

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h" + Math.abs(hash).toString(36);
}

function generateReferralCode(): string {
  return (
    "CH" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    Math.floor(Math.random() * 9999)
  );
}

export function registerFan(data: {
  username: string;
  password: string;
  displayName: string;
  email: string;
  phone?: string;
  tier?: FanTier;
  referredBy?: string;
}): { success: boolean; fan?: Fan; error?: string } {
  const fans = getFans();
  const username = data.username.trim().toLowerCase();

  if (fans.some((f) => f.username === username)) {
    return { success: false, error: "Username already taken" };
  }

  const fan: Fan = {
    id: nextId(),
    username,
    passwordHash: hashPassword(data.password),
    displayName: data.displayName.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() ?? "",
    bio: null,
    avatar: null,
    cover: null,
    tier: data.tier ?? "fan",
    referralCode: generateReferralCode(),
    totalSpent: "0.00",
    createdAt: getNow(),
  };

  fans.push(fan);
  setItem(KEYS.fans, fans);

  // Track signups in analytics
  const analytics = getAnalytics();
  const key = fan.tier === "fanatic" ? "fanaticSignups" : "fanSignups";
  setItem(KEYS.analytics, { ...analytics, [key]: (analytics as Record<string, number>)[key] + 1 });

  // Handle referral code
  if (data.referredBy) {
    // Check if this referral code matches an invite code
    const inviter = getInviterByInviteCode(data.referredBy);
    if (inviter && inviter !== username) {
      // Consume the code so it can't be used again
      consumeInviteCode(data.referredBy);
      // Generate reward codes for both inviter and new fan (10% off one item, no expiry)
      generateCustomRewardCode(10, "one_item", null, "referral");
      generateCustomRewardCode(10, "one_item", null, "referral");
    }
  }
  // Initialise Static Points balance at 0 for new fans
  addStaticPoints(username, 0);
  return { success: true, fan };
}

export function loginFan(username: string, password: string): Fan | null {
  const fans = getFans();
  const fan = fans.find(
    (f) => f.username === username.trim().toLowerCase()
  );
  if (!fan) return null;
  if (fan.passwordHash !== hashPassword(password)) return null;
  return fan;
}

export function getFans(): Fan[] {
  return getItem<Fan[]>(KEYS.fans, []);
}

export function getFan(id: string): Fan | undefined {
  return getFans().find((f) => f.username === id);
}

export function updateFanProfile(id: string, data: Partial<Fan>): void {
  const fans = getFans();
  const updated = fans.map((f) =>
    f.username === id ? { ...f, ...data } : f
  );
  setItem(KEYS.fans, updated);
}

// --- Comments ---

export function getComments(): Comment[] {
  return getItem<Comment[]>(KEYS.comments, []);
}

export function addComment(data: Omit<Comment, "id" | "createdAt">): Comment {
  const comments = getComments();
  const comment: Comment = {
    ...data,
    id: nextId(),
    createdAt: getNow(),
  };
  comments.push(comment);
  setItem(KEYS.comments, comments);

  // Award Static Points for interactions: each comment gives +5 points
  try {
    addStaticPoints(data.authorId, 5);
  } catch {
    /* ignore errors */
  }
  return comment;
}

// --- Polls ---

export function getPolls(): Poll[] {
  return getItem<Poll[]>(KEYS.polls, []);
}

export function addPoll(data: {
  question: string;
  options: string[];
  endsAt?: string | null;
}): Poll {
  const polls = getPolls();
  const votes: Record<number, number> = {};
  data.options.forEach((_, i) => {
    votes[i] = 0;
  });
  const poll: Poll = {
    id: nextId(),
    question: data.question,
    options: data.options,
    votes,
    votedBy: [],
    createdAt: getNow(),
  };
  polls.unshift(poll);
  setItem(KEYS.polls, polls);
  return poll;
}

export function votePoll(
  id: number,
  optionIndex: number,
  userId: string
): void {
  const polls = getPolls();
  const updated = polls.map((p) => {
    if (p.id !== id) return p;
    if (p.votedBy.includes(userId)) return p;
    const newVotes = { ...p.votes };
    newVotes[optionIndex] = (newVotes[optionIndex] ?? 0) + 1;
    return { ...p, votes: newVotes, votedBy: [...p.votedBy, userId] };
  });
  setItem(KEYS.polls, updated);
}

export function deletePoll(id: number): void {
  const polls = getPolls();
  setItem(KEYS.polls, removeById(polls, id));
}

// --- Stories ---

export function getStories(): Story[] {
  return getItem<Story[]>(KEYS.stories, []);
}

export function addStory(data: {
  content: string;
  imageUrl?: string | null;
}): Story {
  const stories = getStories();
  const story: Story = {
    id: nextId(),
    content: data.content,
    imageUrl: data.imageUrl ?? null,
    createdAt: getNow(),
  };
  stories.unshift(story);
  setItem(KEYS.stories, stories);
  return story;
}

export function deleteStory(id: number): void {
  const stories = getStories();
  setItem(KEYS.stories, removeById(stories, id));
}

// --- Collections ---

export function getCollections(): Collection[] {
  return getItem<Collection[]>(KEYS.collections, []);
}

export function addCollection(data: {
  name: string;
  description?: string;
  coverImage?: string | null;
}): Collection {
  const collections = getCollections();
  const collection: Collection = {
    id: nextId(),
    name: data.name,
    description: data.description ?? null,
    coverImage: data.coverImage ?? null,
    createdAt: getNow(),
  };
  collections.unshift(collection);
  setItem(KEYS.collections, collections);
  return collection;
}

export function deleteCollection(id: number): void {
  const collections = getCollections();
  setItem(KEYS.collections, removeById(collections, id));
}

// --- Sales ---

export function getSales(): Sale[] {
  return getItem<Sale[]>(KEYS.sales, []);
}

export function getActiveSales(): Sale[] {
  const now = Date.now();
  return getSales().filter((s) => new Date(s.expiresAt).getTime() > now);
}

export function getActiveSaleForProduct(productId: number): Sale | undefined {
  return getActiveSales().find((s) => s.productIds.includes(productId));
}

export function createSale(data: {
  name: string;
  discountPercent: DiscountPercent;
  productIds: number[];
  expiresAt: string;
}): Sale {
  const sales = getSales();
  const sale: Sale = {
    id: nextId(),
    name: data.name,
    discountPercent: data.discountPercent,
    productIds: data.productIds,
    expiresAt: data.expiresAt,
    createdAt: getNow(),
  };
  sales.unshift(sale);
  setItem(KEYS.sales, sales);
  return sale;
}

export function deleteSale(id: number): void {
  const sales = getSales();
  setItem(KEYS.sales, removeById(sales, id));
}

export function cleanupExpiredSales(): void {
  const now = Date.now();
  const sales = getSales().filter((s) => new Date(s.expiresAt).getTime() > now);
  setItem(KEYS.sales, sales);
}

export function getDiscountedPrice(price: string, discount: number): string {
  const p = parseFloat(price);
  if (isNaN(p)) return price;
  const discounted = p * (1 - discount / 100);
  return discounted.toFixed(2);
}

// --- Tips ---

export function getTips(): Tip[] {
  return getItem<Tip[]>(KEYS.tips, []);
}

export function createTip(data: {
  postId: number;
  fromId: string;
  fromName: string;
  amount: string;
}): Tip {
  const tips = getTips();
  const tip: Tip = {
    ...data,
    id: nextId(),
    createdAt: getNow(),
  };
  tips.unshift(tip);
  setItem(KEYS.tips, tips);

  // Update post tip data
  const post = getPostById(data.postId);
  if (post) {
    const newTipTotal = (parseFloat(post.tips) + parseFloat(data.amount)).toFixed(2);
    editPost(data.postId, {
      tips: newTipTotal,
      tipCount: post.tipCount + 1,
    });
  }

  // Add to wallet
  addToWallet({
    type: "tip",
    amount: data.amount,
    description: post ? `Tip on "${post.title}"` : "Tip",
    fromName: data.fromName,
  });

  return tip;
}

// --- Wallet ---

export function getWallet(): Wallet {
  const entries = getItem<WalletEntry[]>(KEYS.wallet, []);
  const withdrawals = getItem<Withdrawal[]>(KEYS.withdrawals, []);

  const totalIn = entries.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );
  const totalOut = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  const balance = (totalIn - totalOut).toFixed(2);

  return { balance, entries, withdrawals };
}

const KEYS_WITHDRAWALS = "ch_withdrawals";

export function addToWallet(data: {
  type: WalletEntry["type"];
  amount: string;
  description?: string;
  fromName?: string;
}): void {
  const entries = getItem<WalletEntry[]>(KEYS.wallet, []);
  const entry: WalletEntry = {
    id: nextId(),
    type: data.type,
    amount: data.amount,
    description: data.description ?? null,
    fromName: data.fromName ?? null,
    createdAt: getNow(),
  };
  entries.unshift(entry);
  setItem(KEYS.wallet, entries);

  // Update analytics total revenue
  const analytics = getAnalytics();
  const newRevenue = (parseFloat(analytics.totalRevenue) + parseFloat(data.amount)).toFixed(2);
  setItem(KEYS.analytics, { ...analytics, totalRevenue: newRevenue });
}

export function requestWithdrawal(amount: string): boolean {
  const wallet = getWallet();
  if (parseFloat(wallet.balance) < parseFloat(amount)) return false;

  const withdrawals = getItem<Withdrawal[]>(KEYS_WITHDRAWALS, []);
  const withdrawal: Withdrawal = {
    id: nextId(),
    amount,
    status: "pending",
    createdAt: getNow(),
  };
  withdrawals.unshift(withdrawal);
  setItem(KEYS_WITHDRAWALS, withdrawals);
  return true;
}

export function completeWithdrawal(id: number): void {
  const withdrawals = getItem<Withdrawal[]>(KEYS_WITHDRAWALS, []);
  setItem(
    KEYS_WITHDRAWALS,
    withdrawals.map((w) => (w.id === id ? { ...w, status: "completed" as const } : w))
  );
}

// --- Favorites ---

export function getFavorites(): Favorite[] {
  return getItem<Favorite[]>(KEYS.favorites, []);
}

export function toggleFavorite(
  userId: string,
  postId: number
): { favorited: boolean } {
  const favorites = getFavorites();
  const existing = favorites.find(
    (f) => f.userId === userId && f.postId === postId
  );

  if (existing) {
    setItem(
      KEYS.favorites,
      favorites.filter((f) => !(f.userId === userId && f.postId === postId))
    );
    return { favorited: false };
  }

  const fav: Favorite = { id: nextId(), userId, postId };
  favorites.unshift(fav);
  setItem(KEYS.favorites, favorites);

  // Award Static Points for likes/favorites: +5 points when a post is favorited
  try {
    addStaticPoints(userId, 5);
  } catch {
    // ignore errors
  }
  return { favorited: true };
}

export function getFavoritePosts(userId: string): Post[] {
  const favorites = getFavorites().filter((f) => f.userId === userId);
  const posts = getPosts();
  return favorites
    .map((f) => findById(posts, f.postId))
    .filter((p): p is Post => p !== undefined);
}

export function isFavorited(userId: string, postId: number): boolean {
  return getFavorites().some(
    (f) => f.userId === userId && f.postId === postId
  );
}

// --- Downloads ---

export function recordDownload(
  userId: string,
  postId: number,
  postTitle: string,
  downloadUrl: string
): void {
  const downloads = getItem<Download[]>(KEYS.downloads, []);
  const download: Download = {
    id: nextId(),
    userId,
    postId,
    postTitle,
    downloadUrl,
    createdAt: getNow(),
  };
  downloads.unshift(download);
  setItem(KEYS.downloads, downloads);
}

export function getDownloadsForUser(userId: string): Download[] {
  return getItem<Download[]>(KEYS.downloads, []).filter(
    (d) => d.userId === userId
  );
}

// --- Social Links ---

export function getSocialLinks(): SocialLink[] {
  return getItem<SocialLink[]>(KEYS.socialLinks, []);
}

/**
 * Persist a new set of social links. This will overwrite any existing links
 * stored in localStorage. Each link should include a unique id. If you are
 * constructing new links within the UI, you can assign sequential ids or
 * any unique integer. Links with an empty or missing URL should be omitted
 * before saving so only valid links are displayed on the site.
 */
export function saveSocialLinks(links: SocialLink[]): void {
  setItem(KEYS.socialLinks, links);
}

/**
 * Add a single social link. Automatically assigns a new id and stores the
 * provided data. Returns the created SocialLink. The link will be marked
 * active by default. If the platform already exists it will still be added
 * as a separate entry; callers should ensure uniqueness if needed.
 */
export function addSocialLink(data: {
  platform: string;
  url: string;
  displayName?: string | null;
  icon?: string | null;
  isActive?: boolean;
}): SocialLink {
  const links = getSocialLinks();
  const social: SocialLink = {
    id: nextId(),
    platform: data.platform,
    url: data.url,
    displayName: data.displayName ?? null,
    icon: data.icon ?? null,
    isActive: data.isActive ?? true,
  };
  links.push(social);
  setItem(KEYS.socialLinks, links);
  return social;
}

/**
 * Update an existing social link by id. Only provided fields will be
 * overwritten. If the id is not found, nothing happens.
 */
export function updateSocialLink(id: number, data: Partial<SocialLink>): void {
  const links = getSocialLinks();
  const updated = updateById(links, id, data);
  setItem(KEYS.socialLinks, updated);
}

/**
 * Remove a social link by id. If the id does not exist, nothing happens.
 */
export function deleteSocialLink(id: number): void {
  const links = getSocialLinks();
  setItem(KEYS.socialLinks, links.filter((l) => l.id !== id));
}

// --- Site Settings ---

export function getSiteSettings(): SiteSettings {
  return getItem<SiteSettings>(KEYS.siteSettings, {
    siteTitle: "Digital Kingdom",
    tagline: "Your exclusive content platform",
    heroTitle: "Welcome to Digital Kingdom",
    heroSubtitle: "Exclusive content, direct connection",
    heroCtaText: "Get Started",
    accentColor: "#c9a96e",
  });
}

export function updateSiteSettings(settings: Partial<SiteSettings>): void {
  const current = getSiteSettings();
  setItem(KEYS.siteSettings, { ...current, ...settings });
}

// --- Content Prefs ---

export function getContentPrefs(userId: string): ContentPrefs {
  const all = getItem<Record<string, ContentPrefs>>(KEYS.contentPrefs, {});
  return all[userId] ?? {
    feedSort: "recent",
    hideMerch: false,
    hideUpdates: false,
  };
}

export function setContentPrefs(
  userId: string,
  prefs: ContentPrefs
): void {
  const all = getItem<Record<string, ContentPrefs>>(KEYS.contentPrefs, {});
  all[userId] = prefs;
  setItem(KEYS.contentPrefs, all);
}

// --- Notif Prefs ---

export function getNotifPrefs(userId: string): NotifPrefs {
  const all = getItem<Record<string, NotifPrefs>>(KEYS.notifPrefs, {});
  return all[userId] ?? {
    newPosts: true,
    newVideos: true,
    newImages: true,
    newAudio: true,
    newWriting: true,
    newProducts: true,
    newPolls: true,
    mentions: true,
    tips: true,
  };
}

export function setNotifPrefs(userId: string, prefs: NotifPrefs): void {
  const all = getItem<Record<string, NotifPrefs>>(KEYS.notifPrefs, {});
  all[userId] = prefs;
  setItem(KEYS.notifPrefs, all);
}

// --- Referrals ---

export function getReferralCodeForUser(userId: string): string | null {
  const fan = getFan(userId);
  return fan?.referralCode ?? null;
}

// --- Analytics ---

export function recordPageView(page: string): void {
  const analytics = getAnalytics();
  const views = analytics.views + 1;

  // Track page-specific views
  const pageViews = getItem<Record<string, number>>("ch_page_views", {});
  pageViews[page] = (pageViews[page] ?? 0) + 1;
  setItem("ch_page_views", pageViews);

  setItem(KEYS.analytics, { ...analytics, views });
}

export function getAnalytics(): Analytics {
  return getItem<Analytics>(KEYS.analytics, {
    views: 0,
    fanSignups: 0,
    fanaticSignups: 0,
    totalRevenue: "0.00",
  });
}

// --- Leaderboard ---

export function getLeaderboard(): LeaderboardEntry[] {
  return getFans()
    .map((f) => ({
      username: f.username,
      name: f.displayName,
      tier: f.tier,
      totalSpent: f.totalSpent,
    }))
    .sort(
      (a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent)
    );
}

// --- Auto-Like ---

export function getAutoLikeEnabled(): boolean {
  return getItem<boolean>(KEYS.autoLike, false);
}

export function setAutoLikeEnabled(enabled: boolean): void {
  setItem(KEYS.autoLike, enabled);
}

export function getUnlikedComments(): Comment[] {
  const autoLikedIds = getItem<number[]>(KEYS.autoLikedComments, []);
  return getComments().filter((c) => !autoLikedIds.includes(c.id));
}

export function markCommentAutoLiked(commentId: number): void {
  const autoLikedIds = getItem<number[]>(KEYS.autoLikedComments, []);
  if (!autoLikedIds.includes(commentId)) {
    autoLikedIds.push(commentId);
    setItem(KEYS.autoLikedComments, autoLikedIds);
  }
}

export function getAutoLikedCount(): number {
  return getItem<number[]>(KEYS.autoLikedComments, []).length;
}

// --- Theme ---

export function getTheme(): "dark" | "light" {
  const stored = localStorage.getItem(KEYS.theme);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function setTheme(theme: "dark" | "light"): void {
  localStorage.setItem(KEYS.theme, theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// --- Payment Method ---

export function getPaymentMethod(userId: string): PaymentMethod | null {
  const data = localStorage.getItem(`${KEYS.paymentMethod}_${userId}`);
  return data ? JSON.parse(data) : null;
}

export function savePaymentMethod(userId: string, pm: PaymentMethod): void {
  localStorage.setItem(`${KEYS.paymentMethod}_${userId}`, JSON.stringify(pm));
}

// --- Donations ---

export function createDonation(fanId: string, fanName: string, amount: string): { donation: Donation; code: RewardCode } {
  const donations: Donation[] = JSON.parse(localStorage.getItem(KEYS.donations) || "[]");
  const donation: Donation = {
    id: (donations.length > 0 ? Math.max(...donations.map((d) => d.id)) : 0) + 1,
    fanId,
    fanName,
    amount,
    createdAt: new Date().toISOString(),
  };
  donations.push(donation);
  localStorage.setItem(KEYS.donations, JSON.stringify(donations));

  // Generate reward code
  const code = generateRewardCode(amount);
  const codes: RewardCode[] = JSON.parse(localStorage.getItem(KEYS.rewardCodes) || "[]");
  codes.push(code);
  localStorage.setItem(KEYS.rewardCodes, JSON.stringify(codes));

  // Add to wallet
  addToWallet({ type: "donation", amount, description: `Donation from ${fanName}`, fromName: fanName });

  // Award Static Points: 25 points for every $5 donated
  try {
    const amt = parseFloat(amount);
    if (!isNaN(amt) && amt > 0) {
      const pts = Math.floor(amt / 5) * 25;
      if (pts > 0) {
        addStaticPoints(fanId, pts);
      }
    }
  } catch {}

  return { donation, code };
}

export function getDonations(): Donation[] {
  return JSON.parse(localStorage.getItem(KEYS.donations) || "[]");
}

export function getDonationsByFan(fanId: string): Donation[] {
  return getDonations().filter((d) => d.fanId === fanId);
}

// --- Reward Codes ---

function generateRewardCode(donationAmount: string): RewardCode {
  const rand = Math.random() * 100;
  let percent: number;
  let scope: "one_item" | "entire_order";

  // Weighted probability distribution
  if (rand < 60.00)       { percent = 5;  scope = "one_item"; }
  else if (rand < 77.00)  { percent = 10; scope = "one_item"; }
  else if (rand < 87.00)  { percent = 15; scope = "one_item"; }
  else if (rand < 93.00)  { percent = 20; scope = "one_item"; }
  else if (rand < 97.00)  { percent = 25; scope = "one_item"; }
  else if (rand < 98.50)  { percent = 5;  scope = "entire_order"; }
  else if (rand < 99.30)  { percent = 10; scope = "entire_order"; }
  else if (rand < 99.75)  { percent = 15; scope = "entire_order"; }
  else                    { percent = 50; scope = "entire_order"; }

  const code = `DK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    code,
    discountPercent: percent,
    scope,
    used: false,
    createdAt: new Date().toISOString(),
    donationAmount,
  };
}

export function getRewardCodes(): RewardCode[] {
  return JSON.parse(localStorage.getItem(KEYS.rewardCodes) || "[]");
}

export function getRewardCodesByFan(fanId: string): RewardCode[] {
  // Codes are linked to donations, so filter by fan's donations
  const donations = getDonationsByFan(fanId);
  const donationIds = new Set(donations.map((d) => d.createdAt));
  return getRewardCodes().filter((c) => donationIds.has(c.createdAt) && !c.used);
}

// ===========================================================================
// Leaderboard Rewards Scheduler
// ===========================================================================

/**
 * Run the leaderboard scheduler. This function should be called periodically
 * (e.g. every minute) to check if two weeks have passed since the last
 * leaderboard update. When triggered, it awards the top 5 spenders with a
 * 20% off one item code that expires in one week. The timestamp of the
 * update is stored in localStorage to ensure updates occur at most once
 * every two weeks.
 */
export function runLeaderboardScheduler(): void {
  try {
    const last = localStorage.getItem(KEYS.leaderboardLastUpdate);
    const now = new Date();
    let needsUpdate = false;
    if (!last) {
      needsUpdate = true;
    } else {
      const lastDate = new Date(last);
      const diffMs = now.getTime() - lastDate.getTime();
      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
      if (diffMs >= twoWeeksMs) needsUpdate = true;
    }
    if (!needsUpdate) return;
    // Get top 5 fans by totalSpent
    const leaderboard = getLeaderboard().slice(0, 5);
    leaderboard.forEach((entry) => {
      // Award a 20% off one item code with 7-day expiry
      generateCustomRewardCode(20, "one_item", 7, "leaderboard");
    });
    // Update last update timestamp
    localStorage.setItem(KEYS.leaderboardLastUpdate, now.toISOString());
  } catch {
    // Fail silently (e.g. in SSR)
  }
}

export function useRewardCode(code: string): RewardCode | null {
  const codes: RewardCode[] = JSON.parse(localStorage.getItem(KEYS.rewardCodes) || "[]");
  const found = codes.find((c) => c.code === code && !c.used);
  if (!found) return null;
  found.used = true;
  localStorage.setItem(KEYS.rewardCodes, JSON.stringify(codes));
  return found;
}

export function validateRewardCode(code: string): { valid: boolean; percent: number; scope: "one_item" | "entire_order" } | null {
  const codes: RewardCode[] = JSON.parse(localStorage.getItem(KEYS.rewardCodes) || "[]");
  const found = codes.find((c) => c.code === code && !c.used);
  if (!found) return null;
  return { valid: true, percent: found.discountPercent, scope: found.scope };
}

// ===========================================================================
// Static Points & Reward Redemption
// ===========================================================================

/**
 * Retrieve the current Static Points balance for a given fan. If no points have
 * been recorded yet, returns 0.
 */
export function getStaticPoints(userId: string): number {
  const map = getItem<Record<string, number>>(KEYS.staticPoints, {});
  return map[userId] ?? 0;
}

/**
 * Add Static Points to a fan's balance. Points never expire. Use positive
 * integers for points; zero or negative values have no effect.
 */
export function addStaticPoints(userId: string, points: number): void {
  if (!userId || !points || points <= 0) return;
  const map = getItem<Record<string, number>>(KEYS.staticPoints, {});
  map[userId] = (map[userId] ?? 0) + points;
  setItem(KEYS.staticPoints, map);
}

/**
 * Internal helper to generate a custom reward code with a given discount and
 * optional expiry in days. Reason indicates why the code was generated. If
 * expiryDays is null, the code never expires. Codes generated here are
 * appended to the global rewardCodes list.
 */
function generateCustomRewardCode(percent: number, scope: "one_item" | "entire_order", expiryDays: number | null, reason: string): RewardCode {
  const codeStr = `DK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  let expiresAt: string | null = null;
  if (expiryDays && expiryDays > 0) {
    const exp = new Date();
    exp.setDate(exp.getDate() + expiryDays);
    expiresAt = exp.toISOString();
  }
  const code: RewardCode = {
    code: codeStr,
    discountPercent: percent,
    scope,
    used: false,
    createdAt: new Date().toISOString(),
    donationAmount: "0.00",
    expiresAt,
    reason,
  };
  const existing: RewardCode[] = getItem<RewardCode[]>(KEYS.rewardCodes, []);
  existing.push(code);
  setItem(KEYS.rewardCodes, existing);
  return code;
}

/**
 * Redeem Static Points for a discount code. Passing a threshold of 100 returns
 * a 15% off one item discount with no expiry. Passing a threshold of 500
 * returns a 50% off one item discount that expires in 7 days. If the user
 * does not have enough points, returns null. Upon successful redemption the
 * points are deducted.
 */
export function redeemStaticPoints(userId: string, threshold: number): RewardCode | null {
  const current = getStaticPoints(userId);
  if (threshold <= 0) return null;
  if (current < threshold) return null;
  // Determine reward based on threshold
  let percent: number;
  let expiryDays: number | null;
  if (threshold >= 500) {
    percent = 50;
    expiryDays = 7;
  } else if (threshold >= 100) {
    percent = 15;
    expiryDays = null;
  } else {
    return null;
  }
  // Deduct points
  const map = getItem<Record<string, number>>(KEYS.staticPoints, {});
  map[userId] = current - threshold;
  setItem(KEYS.staticPoints, map);
  // Generate code
  return generateCustomRewardCode(percent, "one_item", expiryDays, "static");
}

// ===========================================================================
// Referral Invites & Rewards
// ===========================================================================

/**
 * Generate an invite code for a given fan username and store it in the
 * referralInvites map. When a new fan signs up using this code, both the
 * inviter and the new fan will receive a discount reward. Returns the
 * generated invite code.
 */
export function createInviteCodeForFan(inviterId: string): string {
  // Use the same generator as referral codes to ensure uniqueness
  const code = generateReferralCode();
  const invites = getItem<Record<string, string>>(KEYS.referralInvites, {});
  invites[code] = inviterId;
  setItem(KEYS.referralInvites, invites);
  return code;
}

/**
 * Lookup an inviter by invite code. Returns the inviter's username if found,
 * otherwise undefined. Does not remove the code from storage.
 */
export function getInviterByInviteCode(code: string): string | undefined {
  const invites = getItem<Record<string, string>>(KEYS.referralInvites, {});
  return invites[code];
}

/**
 * Remove an invite code from the map. Called when a referral is successfully
 * redeemed so the same code cannot be reused.
 */
export function consumeInviteCode(code: string): void {
  const invites = getItem<Record<string, string>>(KEYS.referralInvites, {});
  if (invites[code]) {
    delete invites[code];
    setItem(KEYS.referralInvites, invites);
  }
}

/**
 * Toggle the King's live appearance state. When true, fanatics see a banner
 * above the feed indicating a live stream is happening. When false, the
 * banner disappears. This value is stored in localStorage as a stringified
 * boolean.
 */
export function setKingLive(isLive: boolean): void {
  setItem(KEYS.kingLive, isLive ? "true" : "false");
}

/**
 * Retrieve whether the King is currently live streaming. Returns a boolean.
 */
export function getKingLive(): boolean {
  const val = localStorage.getItem(KEYS.kingLive);
  return val === "true";
}

// --- General ---

export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(KEYS_WITHDRAWALS);
  localStorage.removeItem("ch_page_views");
  localStorage.removeItem("fan_user");

  // Remove all user-scoped payment methods (keys match pattern mdk2_payment_method_*)
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(KEYS.paymentMethod + "_")) {
      localStorage.removeItem(key);
    }
  }
}

// --- Seed Data ---

export function seedData(): void {
  // Only seed if no data exists
  if (localStorage.getItem(KEYS.posts)) return;

  // Seed posts
  const seedPosts: Partial<Post>[] = [
    {
      title: "Welcome to Digital Kingdom",
      content:
        "This is your new exclusive content platform. Share creations, connect with fans, and grow your community.",
      type: "update",
      tier: "public",
      mediaType: "none",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: null,
      likes: 42,
      tips: "15.00",
      tipCount: 3,
      scheduledFor: null,
    },
    {
      title: "New Digital Art Collection",
      content:
        "Just dropped a new series of digital illustrations exploring the intersection of nature and technology.",
      type: "creation",
      tier: "fanatic",
      mediaType: "image",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: 1,
      likes: 128,
      tips: "45.50",
      tipCount: 8,
      scheduledFor: null,
    },
    {
      title: "Behind the Scenes Video",
      content:
        "Watch my creative process from sketch to final render in this exclusive behind-the-scenes video.",
      type: "creation",
      tier: "fanatic",
      mediaType: "video",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: null,
      likes: 89,
      tips: "32.00",
      tipCount: 5,
      scheduledFor: null,
    },
    {
      title: "Weekly Q&A Session",
      content:
        "Join me this Friday for a live Q&A session. Submit your questions in the comments!",
      type: "thought",
      tier: "public",
      mediaType: "none",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: null,
      likes: 67,
      tips: "12.00",
      tipCount: 2,
      scheduledFor: null,
    },
    {
      title: "Exclusive Audio Track",
      content:
        "A brand new ambient music track created just for my fanatic supporters. Enjoy the journey.",
      type: "creation",
      tier: "fanatic",
      mediaType: "audio",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: 2,
      likes: 56,
      tips: "28.75",
      tipCount: 4,
      scheduledFor: null,
    },
    {
      title: "Monthly Update - June",
      content:
        "Exciting updates coming this month including new merchandise, live streams, and a special giveaway for loyal fans.",
      type: "update",
      tier: "public",
      mediaType: "none",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: null,
      likes: 34,
      tips: "8.00",
      tipCount: 1,
      scheduledFor: null,
    },
    {
      title: "Writing: The Creative Journey",
      content:
        "A reflective essay on what it means to create in the digital age and how community shapes our work.",
      type: "creation",
      tier: "fanatic",
      mediaType: "document",
      mediaUrl: null,
      downloadUrl: "https://example.com/download1",
      collectionId: null,
      likes: 45,
      tips: "18.00",
      tipCount: 2,
      scheduledFor: null,
    },
    {
      title: "Limited Edition Merch Drop",
      content:
        "New limited edition t-shirts and hoodies are now available in the shop. Only 100 of each design!",
      type: "update",
      tier: "public",
      mediaType: "image",
      mediaUrl: null,
      downloadUrl: null,
      collectionId: null,
      likes: 91,
      tips: "22.00",
      tipCount: 3,
      scheduledFor: null,
    },
  ];

  seedPosts.forEach((p) => addPost(p));

  // Seed default social links if none exist. These entries provide placeholders
  // for all supported platforms. The King can later edit the URLs in the
  // settings page. All links start inactive (url empty) and with null
  // displayName and icon.
  if (!localStorage.getItem(KEYS.socialLinks)) {
    const defaultSocials: SocialLink[] = [
      { id: nextId(), platform: "X", url: "", displayName: null, icon: null, isActive: false },
      { id: nextId(), platform: "TikTok", url: "", displayName: null, icon: null, isActive: false },
      { id: nextId(), platform: "Facebook", url: "", displayName: null, icon: null, isActive: false },
      { id: nextId(), platform: "Spotify", url: "", displayName: null, icon: null, isActive: false },
      { id: nextId(), platform: "Snapchat", url: "", displayName: null, icon: null, isActive: false },
      { id: nextId(), platform: "Twitch", url: "", displayName: null, icon: null, isActive: false },
      { id: nextId(), platform: "YT Music", url: "", displayName: null, icon: null, isActive: false },
    ];
    setItem(KEYS.socialLinks, defaultSocials);
  }

  // Seed products
  const seedProducts: Partial<Product>[] = [
    {
      name: "Digital Art Pack Vol.1",
      description:
        "A collection of 20 high-resolution digital artworks available for instant download.",
      price: "24.99",
      imageUrl: null,
      category: "digital",
      isActive: true,
    },
    {
      name: "Digital Kingdom T-Shirt",
      description:
        "Premium quality cotton t-shirt with exclusive Digital Kingdom design. Available in S, M, L, XL.",
      price: "34.99",
      imageUrl: null,
      category: "merch",
      isActive: true,
    },
    {
      name: "Signed Poster Collection",
      description:
        "Limited edition signed poster set featuring artwork from the latest collection.",
      price: "49.99",
      imageUrl: null,
      category: "physical",
      isActive: true,
    },
    {
      name: "1-on-1 Video Call",
      description:
        "A 30-minute private video call. Perfect for feedback, advice, or just to chat!",
      price: "99.99",
      imageUrl: null,
      category: "exclusive",
      isActive: true,
    },
    {
      name: "Digital Kingdom Hoodie",
      description:
        "Cozy premium hoodie with embroidered logo. Perfect for creators and fans alike.",
      price: "59.99",
      imageUrl: null,
      category: "merch",
      isActive: true,
    },
    {
      name: "Sound Effects Library",
      description:
        "200+ royalty-free sound effects for your creative projects. Instant download.",
      price: "19.99",
      imageUrl: null,
      category: "digital",
      isActive: true,
    },
  ];

  seedProducts.forEach((p) => addProduct(p));

  // Seed collections
  addCollection({
    name: "Digital Art",
    description: "Digital illustrations and artwork",
    coverImage: null,
  });
  addCollection({
    name: "Music & Audio",
    description: "Tracks, soundscapes, and audio content",
    coverImage: null,
  });

  // Seed social links
  const seedSocials: SocialLink[] = [
    {
      id: 1,
      platform: "Twitter",
      url: "https://twitter.com/mydigitalkingdom",
      displayName: "@mydigitalkingdom",
      icon: "twitter",
      isActive: true,
    },
    {
      id: 2,
      platform: "Instagram",
      url: "https://instagram.com/mydigitalkingdom",
      displayName: "@mydigitalkingdom",
      icon: "instagram",
      isActive: true,
    },
    {
      id: 3,
      platform: "YouTube",
      url: "https://youtube.com/mydigitalkingdom",
      displayName: "Digital Kingdom",
      icon: "youtube",
      isActive: true,
    },
    {
      id: 4,
      platform: "Discord",
      url: "https://discord.gg/mydigitalkingdom",
      displayName: "Digital Kingdom Server",
      icon: "discord",
      isActive: true,
    },
  ];
  setItem(KEYS.socialLinks, seedSocials);

  // Seed some comments
  const seedComments: Omit<Comment, "id" | "createdAt">[] = [
    {
      postId: 1,
      authorId: "demo_fan",
      authorName: "Demo Fan",
      authorTier: "fan",
      content: "This platform looks amazing! Can't wait to explore more content.",
    },
    {
      postId: 1,
      authorId: "demo_fanatic",
      authorName: "Demo Fanatic",
      authorTier: "fanatic",
      content: "Just upgraded to fanatic tier. The exclusive content is so worth it!",
    },
    {
      postId: 2,
      authorId: "demo_fan",
      authorName: "Demo Fan",
      authorTier: "fan",
      content: "The digital art collection is stunning! Love the colors.",
    },
  ];
  seedComments.forEach((c) => addComment(c));

  // Seed analytics with initial values
  setItem(KEYS.analytics, {
    views: 1247,
    fanSignups: 86,
    fanaticSignups: 34,
    totalRevenue: "2847.50",
  });
}

// --- Auto-initialize ---

// Run seed data on first load
(function init() {
  try {
    seedData();
  } catch {
    // silent fail in SSR environments
  }
})();
