import { handleAuthRoutes } from './routes/auth.js';
import { handleProfileRoutes } from './routes/profile.js';
import { handlePostRoutes } from './routes/posts.js';
import { handleDataRoutes } from './routes/data.js';
import { handleStoryRoutes } from './routes/stories.js';
import { handleNotificationRoutes } from './routes/notifications.js';
import { handleSearchRoutes } from './routes/search.js';
import { handleFollowRoutes } from './routes/follow.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const handlers = [
      handleAuthRoutes,
      handleProfileRoutes,
      handlePostRoutes,
      handleDataRoutes,
      handleStoryRoutes,
      handleNotificationRoutes,
      handleSearchRoutes,
      handleFollowRoutes
    ];

    for (const handler of handlers) {
      const result = await handler(request, env, url);
      if (result) return result;
    }

    return env.ASSETS.fetch(request);
  }
};
