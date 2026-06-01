import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";

// ─── OAuth Users (Kimi login) ───
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role", { enum: ["fan", "king"] }).default("fan").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
export type User = typeof users.$inferSelect;

// ─── Fan Accounts (username/password) ───
export const fans = sqliteTable("fans", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  displayName: text("displayName"),
  email: text("email"),
  phone: text("phone"),
  bio: text("bio"),
  avatar: text("avatar"),
  cover: text("cover"),
  tier: text("tier", { enum: ["fan", "fanatic"] }).default("fan").notNull(),
  referralCode: text("referralCode"),
  totalSpent: text("totalSpent").default("0.00"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
export type Fan = typeof fans.$inferSelect;

// ─── Posts ───
export const posts = sqliteTable("posts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["thought", "creation", "update"] }).default("thought"),
  tier: text("tier", { enum: ["public", "subscribers", "vip"] }).default("public"),
  mediaType: text("mediaType", { enum: ["none", "image", "video", "audio", "document"] }).default("none"),
  mediaUrl: text("mediaUrl"),
  downloadUrl: text("downloadUrl"),
  collectionId: integer("collectionId"),
  likes: integer("likes").default(0),
  tips: text("tips").default("0.00"),
  tipCount: integer("tipCount").default(0),
  scheduledFor: integer("scheduledFor", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
export type Post = typeof posts.$inferSelect;

// ─── Comments ───
export const comments = sqliteTable("comments", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  authorId: text("authorId").notNull(),
  authorName: text("authorName").notNull(),
  authorTier: text("authorTier", { enum: ["fan", "fanatic"] }).default("fan"),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Products ───
export const products = sqliteTable("products", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("imageUrl"),
  category: text("category", { enum: ["digital", "physical", "merch", "exclusive"] }).default("digital"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Messages ───
export const messages = sqliteTable("messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  senderId: text("senderId").notNull(),
  senderName: text("senderName").notNull(),
  senderTier: text("senderTier", { enum: ["fan", "fanatic"] }).default("fan"),
  receiverId: text("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Orders ───
export const orders = sqliteTable("orders", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  productId: integer("productId").notNull(),
  productName: text("productName").notNull(),
  quantity: integer("quantity").default(1),
  totalPrice: text("totalPrice").notNull(),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).default("pending"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Favorites ───
export const favorites = sqliteTable("favorites", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  postId: integer("postId").notNull(),
});

// ─── Social Links ───
export const socialLinks = sqliteTable("socialLinks", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  displayName: text("displayName"),
  icon: text("icon"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
});

// ─── Collections ───
export const collections = sqliteTable("collections", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  coverImage: text("coverImage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Polls ───
export const polls = sqliteTable("polls", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  options: text("options").notNull(),
  votes: text("votes").notNull(),
  votedBy: text("votedBy").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Stories ───
export const stories = sqliteTable("stories", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Sales ───
export const sales = sqliteTable("sales", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  discountPercent: integer("discountPercent").notNull(),
  productIds: text("productIds").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Tips ───
export const tips = sqliteTable("tips", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  fromId: text("fromId").notNull(),
  fromName: text("fromName").notNull(),
  amount: text("amount").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Wallet ───
export const walletEntries = sqliteTable("walletEntries", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["donation", "order", "tip"] }).notNull(),
  amount: text("amount").notNull(),
  description: text("description"),
  fromName: text("fromName"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Withdrawals ───
export const withdrawals = sqliteTable("withdrawals", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  amount: text("amount").notNull(),
  status: text("status", { enum: ["pending", "completed"] }).default("pending"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Site Settings ───
export const siteSettings = sqliteTable("siteSettings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// ─── Content Prefs ───
export const contentPrefs = sqliteTable("contentPrefs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  feedSort: text("feedSort").default("recent"),
  hideMerch: integer("hideMerch", { mode: "boolean" }).default(false),
  hideUpdates: integer("hideUpdates", { mode: "boolean" }).default(false),
});

// ─── Notif Prefs ───
export const notifPrefs = sqliteTable("notifPrefs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  newPosts: integer("newPosts", { mode: "boolean" }).default(true),
  newVideos: integer("newVideos", { mode: "boolean" }).default(true),
  newImages: integer("newImages", { mode: "boolean" }).default(true),
  newAudio: integer("newAudio", { mode: "boolean" }).default(true),
  newWriting: integer("newWriting", { mode: "boolean" }).default(true),
  newProducts: integer("newProducts", { mode: "boolean" }).default(true),
  newPolls: integer("newPolls", { mode: "boolean" }).default(true),
  mentions: integer("mentions", { mode: "boolean" }).default(true),
  tips: integer("tips", { mode: "boolean" }).default(true),
});

// ─── Payment Methods (NEW) ───
export const paymentMethods = sqliteTable("paymentMethods", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("userId").notNull(),
  cardholderName: text("cardholderName").notNull(),
  cardNumber: text("cardNumber").notNull(),
  expiry: text("expiry").notNull(),
  cvv: text("cvv").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Donations (NEW) ───
export const donations = sqliteTable("donations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  fanId: text("fanId").notNull(),
  fanName: text("fanName").notNull(),
  amount: text("amount").notNull(),
  paypalOrderId: text("paypalOrderId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Reward Codes (NEW) ───
export const rewardCodes = sqliteTable("rewardCodes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  discountPercent: integer("discountPercent").notNull(),
  scope: text("scope", { enum: ["one_item", "entire_order"] }).notNull(),
  used: integer("used", { mode: "boolean" }).default(false),
  donationId: integer("donationId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── Analytics ───
export const analytics = sqliteTable("analytics", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  page: text("page").notNull(),
  views: integer("views").default(0),
  fanSignups: integer("fanSignups").default(0),
  totalRevenue: text("totalRevenue").default("0.00"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
