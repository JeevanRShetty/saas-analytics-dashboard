-- Replace 'YOUR-ORG-ID' with the actual org ID created after you sign up.
-- Find it in Supabase → Table Editor → organizations → copy the id.

-- Seed analytics events (last 30 days)
insert into public.analytics_events
  (organization_id, event_type, page_url, device_type, country, session_id, created_at)
select
  (select id from public.organizations limit 1),
  (array['page_view', 'click', 'form_submit', 'sign_up', 'purchase'])[floor(random() * 5 + 1)],
  (array['/', '/pricing', '/features', '/blog', '/about', '/dashboard'])[floor(random() * 6 + 1)],
  (array['desktop', 'mobile', 'tablet'])[floor(random() * 3 + 1)],
  (array['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'IN'])[floor(random() * 7 + 1)],
  'sess-' || floor(random() * 500)::text,
  now() - (random() * interval '30 days')
from generate_series(1, 2000);

-- Seed AI insights
insert into public.ai_insights (organization_id, type, title, content, severity, acknowledged)
select org.id, 'anomaly', 'Traffic spike on /pricing', 'Page views increased 340% in the last 6 hours vs daily average.', 'high', false
from public.organizations org limit 1;

insert into public.ai_insights (organization_id, type, title, content, severity, acknowledged)
select org.id, 'trend', 'Mobile usage growing week-over-week', 'Mobile sessions up 18% over 4 weeks, now 52% of all sessions.', 'medium', false
from public.organizations org limit 1;

insert into public.ai_insights (organization_id, type, title, content, severity, acknowledged)
select org.id, 'recommendation', 'High bounce rate on /features', 'Single-page session rate of 78% vs site average of 45%. Review CTAs.', 'medium', false
from public.organizations org limit 1;

insert into public.ai_insights (organization_id, type, title, content, severity, acknowledged)
select org.id, 'summary', 'Weekly summary: strong growth', '12,450 total events (+15% WoW), 3,200 unique sessions (+8% WoW).', null, false
from public.organizations org limit 1;

-- Seed audit logs
insert into public.audit_logs
  (organization_id, actor_id, actor_email, action, resource_type, metadata)
select
  (select id from public.organizations limit 1),
  gen_random_uuid(),
  (array['alice@acme.com', 'bob@acme.com', 'carol@acme.com'])[floor(random() * 3 + 1)],
  (array['user.created', 'user.updated', 'settings.updated', 'member.invited'])[floor(random() * 4 + 1)],
  (array['user', 'organization', 'settings', 'member'])[floor(random() * 4 + 1)],
  '{"ip": "192.168.1.1"}'::jsonb
from generate_series(1, 50);
