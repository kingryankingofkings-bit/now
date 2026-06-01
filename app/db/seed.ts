
import { db } from "../api/queries/connection";
import { posts, products, socialLinks } from "./schema";

async function seed() {
  

  const seedPosts = [
    { title: "Behind the Scenes: The Making of Neon Dreams", content: "Just wrapped up the final session on my latest digital art collection. Three weeks of non-stop creation, fueled by midnight espresso and synthwave playlists.", type: "creation" as const, tier: "public" as const, mediaUrl: "/images/drop-1.jpg", likes: 42 },
    { title: "Weekly Thoughts: On Creative Discipline", content: "People often ask me where I find inspiration. The truth is, inspiration is overrated. What matters more is discipline - showing up every single day.", type: "thought" as const, tier: "public" as const, likes: 89 },
    { title: "New Exclusive: Astral Projection Series", content: "My new Astral Projection series is now available for VIP subscribers. This collection of 12 pieces explores out-of-body experiences through abstract digital painting.", type: "creation" as const, tier: "vip" as const, mediaUrl: "/images/drop-2.jpg", likes: 156 },
    { title: "Studio Update: New Equipment Day", content: "Just upgraded the studio with a new Wacom Cintiq Pro 24 and a complete lighting overhaul.", type: "update" as const, tier: "public" as const, likes: 34 },
  ];

  for (const p of seedPosts) {
    await db.insert(posts).values(p);
  }

  const seedProducts = [
    { name: "Neon Dreams: Complete Digital Collection", description: "The entire Neon Dreams series as high-resolution digital downloads.", price: "49.99", imageUrl: "/images/shop-digital.jpg", category: "digital" as const },
    { name: "Limited Edition Signed Print", description: "Archival-quality giclee print on Hahnemuhle Photo Rag paper.", price: "129.99", imageUrl: "/images/shop-print.jpg", category: "physical" as const },
    { name: "CreatorHub Exclusive Hoodie", description: "Premium heavyweight cotton hoodie with metallic gold logo.", price: "79.99", imageUrl: "/images/shop-hoodie.jpg", category: "merch" as const },
    { name: "1-on-1 Digital Art Mentorship Session", description: "A 60-minute private video session.", price: "199.99", imageUrl: "/images/shop-mentorship.jpg", category: "exclusive" as const },
  ];

  for (const p of seedProducts) {
    await db.insert(products).values(p);
  }

  const seedSocials = [
    { platform: "YouTube", url: "https://youtube.com/@creatorhub", displayName: "CreatorHub Official", icon: "youtube" },
    { platform: "Twitch", url: "https://twitch.tv/creatorhub", displayName: "Live Streams", icon: "twitch" },
    { platform: "Discord", url: "https://discord.gg/creatorhub", displayName: "Community Server", icon: "message-circle" },
    { platform: "Twitter", url: "https://twitter.com/creatorhub", displayName: "@creatorhub", icon: "twitter" },
    { platform: "Instagram", url: "https://instagram.com/creatorhub", displayName: "@creatorhub", icon: "instagram" },
    { platform: "TikTok", url: "https://tiktok.com/@creatorhub", displayName: "@creatorhub", icon: "music" },
  ];

  for (const s of seedSocials) {
    await db.insert(socialLinks).values(s);
  }

  console.log("Seed data inserted successfully!");
}

seed().catch(console.error);