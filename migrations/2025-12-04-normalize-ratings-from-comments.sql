-- Normalize ratings for movies and series from comments.
-- Run this when you want to recalculate item ratings based on all existing comments.
-- NOTE: This will overwrite the current rating values in movies/series.

-- Movies: set rating to rounded average of related comment ratings
WITH movie_avg AS (
  SELECT item_id, round(avg(rating)::numeric, 1) AS avg_rating
  FROM public.comments
  WHERE item_type = 'movie'
  GROUP BY item_id
)
UPDATE public.movies m
SET rating = movie_avg.avg_rating
FROM movie_avg
WHERE m.id = movie_avg.item_id;

-- Series: set rating to rounded average of related comment ratings
WITH series_avg AS (
  SELECT item_id, round(avg(rating)::numeric, 1) AS avg_rating
  FROM public.comments
  WHERE item_type = 'series'
  GROUP BY item_id
)
UPDATE public.series s
SET rating = series_avg.avg_rating
FROM series_avg
WHERE s.id = series_avg.item_id;

-- Optional: if you'd like to clear ratings when there are no comments, uncomment these:
-- UPDATE public.movies m
-- SET rating = NULL
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.comments c WHERE c.item_type='movie' AND c.item_id=m.id
-- );
-- UPDATE public.series s
-- SET rating = NULL
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.comments c WHERE c.item_type='series' AND c.item_id=s.id
-- );
