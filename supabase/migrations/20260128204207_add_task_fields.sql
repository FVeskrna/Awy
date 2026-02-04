create table if not exists "public"."tasks" (
    "id" text primary key,
    "user_id" uuid references auth.users not null,
    "parent_id" text,
    "title" text not null,
    "is_focused" boolean default false,
    "priority" text default 'low',
    "estimate" text,
    "due_date" text,
    "completed" boolean default false,
    "created_at" bigint,
    "category" text,
    "status" text default 'todo'
);

alter table "public"."tasks" enable row level security;

create policy "Users can only see and edit their own tasks"
on "public"."tasks"
for all using ( auth.uid() = user_id );
