
import { db } from "../api/queries/connection";

async function drop() {
  
  await db.execute("DROP TABLE IF EXISTS collections, polls, stories, sales, tips, walletEntries, withdrawals, siteSettings, contentPrefs, notifPrefs, favorites, comments, messages, orders, fans, socialLinks, products, posts");
  console.log("Dropped all tables");
}

drop().catch(console.error);