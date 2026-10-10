-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tech',
  message TEXT NOT NULL,
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  granted_by TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated, anon;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT ALL ON public.activity_logs TO service_role;
