-- ============================================================
-- Migration: image_generation_config
-- Allows admins to configure image generation models and limits
-- ============================================================

create table if not exists image_generation_config (
  id uuid default gen_random_uuid() primary key,
  config_key text unique not null,
  config_value jsonb not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- Initial configuration: model assignments for cover and scene images
insert into image_generation_config (config_key, config_value) values
('imagen_models', '{
  "cover": {
    "model": "imagen-4.0-generate-001",
    "label": "Standard",
    "cost_per_image": 0.04
  },
  "scene": {
    "model": "imagen-4.0-fast-generate-001",
    "label": "Fast",
    "cost_per_image": 0.02
  }
}'::jsonb),
('generation_limits', '{
  "max_images_per_story": 4,
  "max_stories_per_day_free": 2,
  "max_stories_per_day_premium": 10
}'::jsonb);

-- Enable RLS
alter table image_generation_config enable row level security;

-- All authenticated users can read (app needs config at runtime)
create policy "Authenticated users can read config"
  on image_generation_config for select
  to authenticated
  using (true);

-- Only admins can write (insert/update/delete)
create policy "Only admins can modify config"
  on image_generation_config for insert
  to authenticated
  with check (
    exists (
      select 1 from user_roles
      where user_roles.auth_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Only admins can update config"
  on image_generation_config for update
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_roles.auth_id = auth.uid()
      and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_roles.auth_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Only admins can delete config"
  on image_generation_config for delete
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_roles.auth_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );
