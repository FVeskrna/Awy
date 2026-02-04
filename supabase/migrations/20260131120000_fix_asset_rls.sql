-- Allow users to delete their own assets
create policy "Users can delete their own assets"
on public.assets for delete
using ( auth.uid() = user_id );

-- Allow users to update their own assets
create policy "Users can update their own assets"
on public.assets for update
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );
