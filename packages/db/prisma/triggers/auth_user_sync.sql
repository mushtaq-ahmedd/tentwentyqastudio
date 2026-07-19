-- Supabase's documented pattern: sync auth.users -> our public.users profile table on signup.
-- Scope for this pass: self-service signup only. Admin-invited users (shared/modals.js's
-- Invite User flow) are created directly in public.users with status INVITED and don't yet
-- have a Supabase Auth account — wiring that to Supabase's inviteUserByEmail() admin API is a
-- follow-up, not done here.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, role, status, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'QA_ENGINEER',
    'ACTIVE',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
