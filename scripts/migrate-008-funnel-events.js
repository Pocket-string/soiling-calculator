/**
 * Migration 008: funnel_events table
 * Run: node scripts/migrate-008-funnel-events.js
 */

const https = require('https');

const ACCESS_TOKEN = 'sbp_973064eec76c672c5ffb3b4c633f740e18301b9d';
const PROJECT_REF  = 'yduujlxtymhtnxcbwldh';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== Migration 008: funnel_events table ===');

  // 1. Create table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS funnel_events (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      event_name text NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      lead_id uuid,
      metadata jsonb DEFAULT '{}',
      ip_address text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('  [OK] funnel_events table');

  // 2. Indexes
  await runSQL(`CREATE INDEX IF NOT EXISTS idx_funnel_events_name ON funnel_events(event_name);`);
  await runSQL(`CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON funnel_events(created_at);`);
  await runSQL(`CREATE INDEX IF NOT EXISTS idx_funnel_events_user ON funnel_events(user_id) WHERE user_id IS NOT NULL;`);
  console.log('  [OK] Indexes');

  // 3. Enable RLS
  await runSQL(`ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;`);
  console.log('  [OK] RLS enabled');

  // 4. RLS policies
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Admin can read funnel events" ON funnel_events
        FOR SELECT TO authenticated
        USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.access_level = 'admin')
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Service role full access on funnel_events" ON funnel_events
        FOR ALL USING (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  console.log('  [OK] RLS policies');

  // 5. Verify
  const result = await runSQL(`SELECT count(*) as cnt FROM funnel_events;`);
  console.log('\n=== Verification ===');
  console.log('  funnel_events count:', JSON.stringify(result));

  console.log('\nDone!');
}

main().catch(console.error);
