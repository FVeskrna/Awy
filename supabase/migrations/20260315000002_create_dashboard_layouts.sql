-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    layout_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own dashboard layout"
    ON public.dashboard_layouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard layout"
    ON public.dashboard_layouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layout"
    ON public.dashboard_layouts FOR UPDATE
    USING (auth.uid() = user_id);

-- Handle updated_at
CREATE TRIGGER set_dashboard_layouts_updated_at
    BEFORE UPDATE ON public.dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
