-- CHRYSALIS PRESENCE Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  total_presence_time integer default 0,
  current_streak integer default 0,
  privacy_level text default 'friends' check (privacy_level in ('public', 'friends', 'private')),
  last_active timestamp with time zone default timezone('utc'::text, now())
);

-- Presence sessions table
create table if not exists presence_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_seconds integer,
  session_type text not null check (session_type in ('micro', 'breathing', 'collective', 'custom')),
  quality_rating integer check (quality_rating >= 1 and quality_rating <= 5),
  trigger_type text check (trigger_type in ('manual', 'automatic', 'scheduled')),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Friend connections table
create table if not exists friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  friend_id uuid references users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, friend_id)
);

-- Mindfulness groups table
create table if not exists mindfulness_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  creator_id uuid references users(id) on delete cascade not null,
  description text,
  max_members integer default 20,
  privacy_level text default 'invite_only' check (privacy_level in ('public', 'invite_only', 'private')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Group memberships table
create table if not exists group_memberships (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references mindfulness_groups(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  role text default 'member' check (role in ('creator', 'admin', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(group_id, user_id)
);

-- Real-time presence signals table
create table if not exists presence_signals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  latitude decimal(10, 8), -- Anonymized/fuzzy location
  longitude decimal(11, 8),
  is_active boolean default true,
  signal_strength decimal(3, 2) default 1.0, -- 0.0 to 1.0
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Daily wisdom quotes table
create table if not exists wisdom_quotes (
  id uuid default gen_random_uuid() primary key,
  quote_text text not null,
  author_name text not null,
  source_book text,
  category text,
  language text default 'en',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- User achievements table
create table if not exists user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  achievement_type text not null, -- 'streak', 'session_count', 'total_time', etc.
  achievement_value integer not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()),
  metadata jsonb
);

-- Indexes for performance
create index if not exists idx_presence_sessions_user_id on presence_sessions(user_id);
create index if not exists idx_presence_sessions_start_time on presence_sessions(start_time);
create index if not exists idx_friendships_user_id on friendships(user_id);
create index if not exists idx_friendships_friend_id on friendships(friend_id);
create index if not exists idx_presence_signals_user_id on presence_signals(user_id);
create index if not exists idx_presence_signals_expires_at on presence_signals(expires_at);
create index if not exists idx_group_memberships_group_id on group_memberships(group_id);
create index if not exists idx_group_memberships_user_id on group_memberships(user_id);

-- Row Level Security (RLS) policies
alter table users enable row level security;
alter table presence_sessions enable row level security;
alter table friendships enable row level security;
alter table mindfulness_groups enable row level security;
alter table group_memberships enable row level security;
alter table presence_signals enable row level security;
alter table user_achievements enable row level security;

-- Users policies
create policy "Users can view their own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = id);

-- Presence sessions policies
create policy "Users can view their own sessions" on presence_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions" on presence_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions" on presence_sessions
  for update using (auth.uid() = user_id);

-- Friendships policies
create policy "Users can view their own friendships" on friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friendship requests" on friendships
  for insert with check (auth.uid() = user_id);

create policy "Users can update friendships they're part of" on friendships
  for update using (auth.uid() = user_id or auth.uid() = friend_id);

-- Presence signals policies
create policy "Users can view nearby active signals" on presence_signals
  for select using (is_active = true and expires_at > now());

create policy "Users can manage their own signals" on presence_signals
  for all using (auth.uid() = user_id);

-- Wisdom quotes are publicly readable
create policy "Anyone can view wisdom quotes" on wisdom_quotes
  for select using (is_active = true);

-- Functions for automatic data management
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_users_updated_at before update on users
  for each row execute procedure update_updated_at_column();

create trigger update_friendships_updated_at before update on friendships
  for each row execute procedure update_updated_at_column();

create trigger update_groups_updated_at before update on mindfulness_groups
  for each row execute procedure update_updated_at_column();

-- Function to clean up expired presence signals
create or replace function cleanup_expired_presence_signals()
returns void as $$
begin
  delete from presence_signals where expires_at < now();
end;
$$ language plpgsql;

-- Function to calculate user streak
create or replace function calculate_user_streak(user_uuid uuid)
returns integer as $$
declare
  streak_count integer := 0;
  check_date date := current_date;
  has_session boolean;
begin
  loop
    select exists(
      select 1 from presence_sessions 
      where user_id = user_uuid 
      and date(start_time) = check_date
    ) into has_session;
    
    if not has_session then
      exit;
    end if;
    
    streak_count := streak_count + 1;
    check_date := check_date - interval '1 day';
  end loop;
  
  return streak_count;
end;
$$ language plpgsql;

-- Insert some sample wisdom quotes
insert into wisdom_quotes (quote_text, author_name, category) values
  ('The present moment is the only moment available to us, and it is the door to all moments.', 'Thich Nhat Hanh', 'presence'),
  ('Be here now.', 'Ram Dass', 'presence'),
  ('Wherever you are, be there totally.', 'Eckhart Tolle', 'presence'),
  ('The only way to live is by accepting each minute as an unrepeatable miracle.', 'Tara Brach', 'acceptance'),
  ('Peace comes from within. Do not seek it without.', 'Buddha', 'inner_peace'),
  ('In the end, just three things matter: How well we have lived, How well we have loved, How well we have learned to let go.', 'Jack Kornfield', 'wisdom')
on conflict do nothing;
