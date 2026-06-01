
import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";

// Feature routers
import { fanRouter } from "./routers/fan-router";
import { postRouter } from "./routers/post-router";
import { productRouter } from "./routers/product-router";
import { messageRouter } from "./routers/message-router";
import { socialRouter } from "./routers/social-router";
import { orderRouter } from "./routers/order-router";
import { commentRouter } from "./routers/comment-router";
import { collectionRouter } from "./routers/collection-router";
import { pollRouter } from "./routers/poll-router";
import { storyRouter } from "./routers/story-router";
import { saleRouter } from "./routers/sale-router";
import { tipRouter } from "./routers/tip-router";
import { walletRouter } from "./routers/wallet-router";
import { favoriteRouter } from "./routers/favorite-router";
import { settingRouter } from "./routers/setting-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  fan: fanRouter,
  post: postRouter,
  product: productRouter,
  message: messageRouter,
  social: socialRouter,
  order: orderRouter,
  comment: commentRouter,
  collection: collectionRouter,
  poll: pollRouter,
  story: storyRouter,
  sale: saleRouter,
  tip: tipRouter,
  wallet: walletRouter,
  favorite: favoriteRouter,
  setting: settingRouter,
});

export type AppRouter = typeof appRouter;