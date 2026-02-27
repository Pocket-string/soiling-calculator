-- Migration 013: Fix Supabase Linter Warnings (Security + Performance)
--
-- Fixes:
--   SECURITY: function_search_path_mutable (2 functions)
--   SECURITY: rls_policy_always_true (3 policies: leads x2, notification_log x1)
--   PERFORMANCE: auth_rls_initplan (27 policies using auth.uid() instead of (select auth.uid()))
--   PERFORMANCE: multiple_permissive_policies (redundant "Service role full access" policies)
--
-- Note: auth_leaked_password_protection requires manual action in Supabase Dashboard.

BEGIN;

-- ============================================================================
-- BLOQUE A: Fix function search_path (SECURITY)
-- ============================================================================

ALTER FUNCTION public.update_production_readings_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';


-- ============================================================================
-- BLOQUE B: Drop redundant "Service role full access" policies (PERFORMANCE)
-- Service role already bypasses RLS by default in Supabase.
-- These cause multiple_permissive_policies warnings.
-- ============================================================================

DROP POLICY IF EXISTS "Service role full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access on invites" ON invites;
DROP POLICY IF EXISTS "Service role full access on funnel_events" ON funnel_events;

-- Also drop the permissive INSERT on notification_log (service role doesn't need it)
DROP POLICY IF EXISTS "Service insert logs" ON notification_log;


-- ============================================================================
-- BLOQUE C: Restrict leads INSERT policies (SECURITY)
-- Change WITH CHECK (true) to require non-empty email
-- ============================================================================

DROP POLICY IF EXISTS "anon_can_apply" ON leads;
CREATE POLICY "anon_can_apply" ON leads
  FOR INSERT TO anon
  WITH CHECK (email IS NOT NULL AND email <> '');

DROP POLICY IF EXISTS "auth_can_apply" ON leads;
CREATE POLICY "auth_can_apply" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (email IS NOT NULL AND email <> '');


-- ============================================================================
-- BLOQUE D: Replace auth.uid() with (select auth.uid()) in ALL policies
-- This prevents re-evaluation per row (auth_rls_initplan fix)
-- ============================================================================

-- ── plants ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "plants_select_own" ON plants;
CREATE POLICY "plants_select_own" ON plants
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "plants_insert_own" ON plants;
CREATE POLICY "plants_insert_own" ON plants
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "plants_update_own" ON plants;
CREATE POLICY "plants_update_own" ON plants
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "plants_delete_own" ON plants;
CREATE POLICY "plants_delete_own" ON plants
  FOR DELETE USING ((select auth.uid()) = user_id);


-- ── production_readings ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "readings_select_own" ON production_readings;
CREATE POLICY "readings_select_own" ON production_readings
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "readings_insert_own" ON production_readings;
CREATE POLICY "readings_insert_own" ON production_readings
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "readings_update_own" ON production_readings;
CREATE POLICY "readings_update_own" ON production_readings
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "readings_delete_own" ON production_readings;
CREATE POLICY "readings_delete_own" ON production_readings
  FOR DELETE USING ((select auth.uid()) = user_id);


-- ── users ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING ((select auth.uid()) = id);


-- ── irradiance_cache ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "irradiance_cache_insert_auth" ON irradiance_cache;
CREATE POLICY "irradiance_cache_insert_auth" ON irradiance_cache
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "irradiance_cache_update_auth" ON irradiance_cache;
CREATE POLICY "irradiance_cache_update_auth" ON irradiance_cache
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);


-- ── profiles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Keep "Admins read all profiles" but fix it too
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.access_level = 'admin'
    )
  );


-- ── funnel_events ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can read funnel events" ON funnel_events;
CREATE POLICY "Admin can read funnel events" ON funnel_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.access_level = 'admin'
    )
  );


-- ── notification_preferences ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users read own prefs" ON notification_preferences;
CREATE POLICY "Users read own prefs" ON notification_preferences
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own prefs" ON notification_preferences;
CREATE POLICY "Users update own prefs" ON notification_preferences
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own prefs" ON notification_preferences;
CREATE POLICY "Users insert own prefs" ON notification_preferences
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);


-- ── notification_log ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users read own logs" ON notification_log;
CREATE POLICY "Users read own logs" ON notification_log
  FOR SELECT USING ((select auth.uid()) = user_id);


-- ── api_keys ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users read own keys" ON api_keys;
CREATE POLICY "Users read own keys" ON api_keys
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own keys" ON api_keys;
CREATE POLICY "Users insert own keys" ON api_keys
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own keys" ON api_keys;
CREATE POLICY "Users update own keys" ON api_keys
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own keys" ON api_keys;
CREATE POLICY "Users delete own keys" ON api_keys
  FOR DELETE USING ((select auth.uid()) = user_id);


-- ── inverter_integrations ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users read own integrations" ON inverter_integrations;
CREATE POLICY "Users read own integrations" ON inverter_integrations
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own integrations" ON inverter_integrations;
CREATE POLICY "Users insert own integrations" ON inverter_integrations
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own integrations" ON inverter_integrations;
CREATE POLICY "Users update own integrations" ON inverter_integrations
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own integrations" ON inverter_integrations;
CREATE POLICY "Users delete own integrations" ON inverter_integrations
  FOR DELETE USING ((select auth.uid()) = user_id);

COMMIT;
