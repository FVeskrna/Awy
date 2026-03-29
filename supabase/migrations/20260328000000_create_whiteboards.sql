-- Create whiteboards table
CREATE TABLE IF NOT EXISTS public.whiteboards (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see and edit their own whiteboards"
    ON public.whiteboards
    FOR ALL USING (auth.uid() = user_id);

-- Create whiteboard_items table
CREATE TABLE IF NOT EXISTS public.whiteboard_items (
    id TEXT PRIMARY KEY,
    whiteboard_id TEXT NOT NULL REFERENCES public.whiteboards(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    x DOUBLE PRECISION NOT NULL DEFAULT 0,
    y DOUBLE PRECISION NOT NULL DEFAULT 0,
    content TEXT,
    module_id TEXT,
    ref_id TEXT,
    color TEXT,
    z_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.whiteboard_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see and edit their own whiteboard items"
    ON public.whiteboard_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards w
            WHERE w.id = whiteboard_id
            AND w.user_id = auth.uid()
        )
    );
