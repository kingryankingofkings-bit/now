import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { db } from "./queries/connection";
import { siteSettings, socialLinks, products, posts, collections, comments, polls, sales } from "@db/schema";
import { sql } from "drizzle-orm";

const app = new Hono<{ Bindings: HttpBindings }>();

// ─── CORS ───
app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
  allowHeaders: ["Content-Type", "x-fan-token", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  exposeHeaders: ["x-fan-token"],
}));

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ─── OAuth Callback ───
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// ─── Health Check ───
app.get("/api/health", (c) => c.json({ ok: true, db: true, ts: Date.now() }));

// ─── Database Init / Seed ───
app.post("/api/init-db", async (c) => {
  try {
    // Create tables if they don't exist (drizzle-kit push handles this, but as fallback)
    // Seed default data
    const existingSettings = db.select().from(siteSettings).all();
    if (existingSettings.length === 0) {
      // Seed site settings
      const defaults = [
        { key: "siteTitle", value: "My Digital Kingdom" },
        { key: "tagline", value: "Your personal digital mansion" },
        { key: "heroTitle", value: "The Digital Mansion" },
        { key: "heroSubtitle", value: "Your all-access pass to my creative world. Explore my latest works, shop exclusive content, connect directly, and become part of the community." },
        { key: "heroCtaText", value: "Enter the Mansion" },
        { key: "accentColor", value: "#c9a96e" },
      ];
      for (const s of defaults) {
        db.insert(siteSettings).values(s).run();
      }
    }

    // Seed social links
    const existingSocials = db.select().from(socialLinks).all();
    if (existingSocials.length === 0) {
      const socials = [
        { platform: "YouTube", url: "https://youtube.com/mydigitalkingdom", displayName: "My Digital Kingdom", icon: "youtube" },
        { platform: "Twitch", url: "https://twitch.tv/mydigitalkingdom", displayName: "@mydigitalkingdom", icon: "twitch" },
        { platform: "Discord", url: "https://discord.gg/mydigitalkingdom", displayName: "My Digital Kingdom Server", icon: "discord" },
        { platform: "Twitter", url: "https://twitter.com/mydigitalkingdom", displayName: "@mydigitalkingdom", icon: "twitter" },
        { platform: "Instagram", url: "https://instagram.com/mydigitalkingdom", displayName: "@mydigitalkingdom", icon: "instagram" },
        { platform: "TikTok", url: "https://tiktok.com/@mydigitalkingdom", displayName: "@mydigitalkingdom", icon: "tiktok" },
      ];
      for (const s of socials) {
        db.insert(socialLinks).values(s).run();
      }
    }

    // Seed products
    const existingProducts = db.select().from(products).all();
    if (existingProducts.length === 0) {
      const prods = [
        { name: "Digital Art Pack Vol. 1", description: "A curated collection of 25 high-resolution digital artworks.", price: "15.00", category: "digital" as const, isActive: true },
        { name: "My Digital Kingdom T-Shirt", description: "Premium cotton tee with My Digital Kingdom design.", price: "29.99", category: "merch" as const, isActive: true },
        { name: "Creator Wallpaper Bundle", description: "Exclusive desktop and mobile wallpapers.", price: "5.00", category: "digital" as const, isActive: true },
        { name: "My Digital Kingdom Hoodie", description: "Cozy hoodie with embroidered logo.", price: "59.99", category: "merch" as const, isActive: true },
        { name: "1-on-1 Video Call", description: "30-minute private video session.", price: "100.00", category: "exclusive" as const, isActive: true },
        { name: "Behind the Scenes eBook", description: "Digital book about the creative process.", price: "12.99", category: "digital" as const, isActive: true },
      ];
      for (const p of prods) {
        db.insert(products).values(p).run();
      }
    }

    // Seed posts
    const existingPosts = db.select().from(posts).all();
    if (existingPosts.length === 0) {
      const postData = [
        { title: "Welcome to My Digital Kingdom", content: "This is your home for all my creative work. Stay tuned for exclusive content, behind-the-scenes updates, and more!", type: "thought" as const, tier: "public" as const, mediaType: "none" as const, likes: 91 },
        { title: "Limited Edition Merch Drop", content: "New limited edition t-shirts and hoodies are now available in the shop. Only 100 of each design!", type: "creation" as const, tier: "public" as const, mediaType: "image" as const, likes: 87 },
        { title: "Writing: The Creative Journey", content: "A reflective essay on what it means to create in the digital age and how community shapes our work.", type: "creation" as const, tier: "subscribers" as const, mediaType: "document" as const, likes: 45 },
        { title: "Monthly Update - June", content: "Exciting updates coming this month including new merchandise, live streams, and a special giveaway for loyal fans.", type: "update" as const, tier: "public" as const, mediaType: "none" as const, likes: 34 },
        { title: "Exclusive Audio Track", content: "A brand new ambient music track created just for my supporters. Enjoy the journey.", type: "creation" as const, tier: "vip" as const, mediaType: "audio" as const, likes: 56 },
        { title: "Weekly Q&A Session", content: "Join me this Friday for a live Q&A session. Submit your questions in the comments!", type: "thought" as const, tier: "public" as const, mediaType: "none" as const, likes: 67 },
        { title: "Behind the Scenes Video", content: "Watch my creative process from sketch to final render in this exclusive behind-the-scenes video.", type: "creation" as const, tier: "subscribers" as const, mediaType: "video" as const, likes: 78 },
        { title: "New Tutorial Series", content: "Starting next week: a comprehensive tutorial series on digital illustration techniques.", type: "update" as const, tier: "public" as const, mediaType: "none" as const, likes: 52 },
      ];
      for (const p of postData) {
        db.insert(posts).values(p).run();
      }
    }

    // Seed collections
    const existingCollections = db.select().from(collections).all();
    if (existingCollections.length === 0) {
      db.insert(collections).values({ name: "Featured Works", description: "My best creations" }).run();
      db.insert(collections).values({ name: "Tutorials", description: "Learning resources" }).run();
    }

    // Seed a poll
    const existingPolls = db.select().from(polls).all();
    if (existingPolls.length === 0) {
      db.insert(polls).values({
        question: "What should I create next?",
        options: JSON.stringify(["Digital Art Series", "Music Track", "Video Tutorial", "Live Stream"]),
        votes: JSON.stringify([0, 0, 0, 0]),
        votedBy: JSON.stringify([]),
      }).run();
    }

    // Seed a sale
    const existingSales = db.select().from(sales).all();
    if (existingSales.length === 0) {
      const expiresAt = new Date(Date.now() + 48 * 3600000);
      db.insert(sales).values({
        name: "Summer Sale",
        discountPercent: 20,
        productIds: JSON.stringify([1, 2, 3]),
        expiresAt,
      }).run();
    }

    return c.json({ success: true, message: "Database initialized with seed data" });
  } catch (error: any) {
    console.error("DB init error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─── PayPal: Create Order ───
app.post("/api/paypal/create-order", async (c) => {
  try {
    const body = await c.req.json();
    const { amount, description } = body;
    
    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    const baseUrl = process.env.PAYPAL_ENV === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";
    
    // Get access token
    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const authData = await authRes.json() as any;
    
    // Create order
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amount },
          description: description || "My Digital Kingdom",
        }],
      }),
    });
    const orderData = await orderRes.json() as any;
    return c.json({ orderId: orderData.id, status: orderData.status });
  } catch (error: any) {
    console.error("PayPal create order error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ─── PayPal: Capture Order ───
app.post("/api/paypal/capture-order", async (c) => {
  try {
    const body = await c.req.json();
    const { orderId } = body;
    
    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    const baseUrl = process.env.PAYPAL_ENV === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";
    
    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const authData = await authRes.json() as any;
    
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authData.access_token}`,
        "Content-Type": "application/json",
      },
    });
    const captureData = await captureRes.json() as any;
    return c.json({ 
      status: captureData.status, 
      payer: captureData.payer,
      purchaseUnits: captureData.purchase_units,
    });
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ─── Email: Send ───
app.post("/api/send-email", async (c) => {
  try {
    const body = await c.req.json();
    const { to, subject, html } = body;
    
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Email service not configured" }, 503);
    }
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "noreply@mydigitalkingdom.com",
        to,
        subject,
        html,
      }),
    });
    const data = await res.json() as any;
    return c.json({ success: true, id: data.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ─── tRPC ───
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// ─── Production Server ───
if (process.env.NODE_ENV === "production") {
  const startServer = async () => {
    const { serve } = await import("@hono/node-server");
    const { serveStaticFiles } = await import("./lib/vite");
    serveStaticFiles(app);

    const port = parseInt(process.env.PORT || "3000");
    serve({ fetch: app.fetch, port }, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  };
  startServer();
}
