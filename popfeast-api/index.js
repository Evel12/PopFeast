import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env from .env.local or .env
dotenv.config();

// Import serverless handlers
import health from './api/health.js';
import moviesIndex from './api/movies/index.js';
import movieById from './api/movies/[id].js';
import movieComments from './api/movies/[id]/comments.js';
import seriesIndex from './api/series/index.js';
import seriesById from './api/series/[id].js';
import seriesComments from './api/series/[id]/comments.js';
import favoritesIndex from './api/favorites/index.js';
import favoritesAdd from './api/favorites/add.js';
import favoritesRemove from './api/favorites/remove.js';

const app = express();
app.use(cors());
app.use(express.json());

// Adapter: call Vercel-style handler for all methods on a route
function mountAll(path, handler){
  app.all(path, (req,res) => handler(req,res));
}

mountAll('/api/health', health);

mountAll('/api/movies', moviesIndex);
mountAll('/api/movies/:id', movieById);
mountAll('/api/movies/:id/comments', movieComments);

mountAll('/api/series', seriesIndex);
mountAll('/api/series/:id', seriesById);
mountAll('/api/series/:id/comments', seriesComments);

mountAll('/api/favorites', favoritesIndex);
mountAll('/api/favorites/add', favoritesAdd);
mountAll('/api/favorites/remove', favoritesRemove);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[popfeast-api] Local server running at http://localhost:${PORT}`);
});
