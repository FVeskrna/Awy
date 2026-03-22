-- Rename project_hashtag to work_item
ALTER TABLE public.daily_logs 
RENAME COLUMN project_hashtag TO work_item;

-- Optionally remove refined_content if you want a clean break
-- ALTER TABLE public.daily_logs DROP COLUMN refined_content;
