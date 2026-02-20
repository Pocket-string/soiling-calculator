/**
 * Migration 006 + 007: profiles + invites tables
 * Run: node scripts/migrate-006-007-profiles-invites.js
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
  console.log('=== Migration 006: profiles table ===');

  // 1. Create access_level enum
  await runSQL(`
    DO $$ BEGIN
      CREATE TYPE access_level AS ENUM ('founding', 'admin', 'paid', 'free');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('  [OK] access_level enum');

  // 2. Create profiles table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT,
      access_level access_level NOT NULL DEFAULT 'free',
      trial_ends_at TIMESTAMPTZ,
      max_plants INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log('  [OK] profiles table');

  // 3. Enable RLS
  await runSQL(`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`);
  console.log('  [OK] RLS enabled');

  // 4. RLS policies
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Users read own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Users update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Service role full access on profiles" ON profiles
        FOR ALL USING (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  console.log('  [OK] RLS policies');

  // 5. Migrate existing users
  const migrateResult = await runSQL(`
    INSERT INTO profiles (id, trial_ends_at, access_level, max_plants)
    SELECT id, trial_ends_at, 'founding'::access_level, 1
    FROM users WHERE trial_ends_at IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  [OK] Migrated existing users:', JSON.stringify(migrateResult));

  console.log('\n=== Migration 007: invites table ===');

  // 6. Create invites table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      access_level access_level NOT NULL DEFAULT 'founding',
      max_plants INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','consumed','expired')),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
      consumed_at TIMESTAMPTZ,
      created_by UUID NOT NULL REFERENCES auth.users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log('  [OK] invites table');

  // 7. Enable RLS on invites
  await runSQL(`ALTER TABLE invites ENABLE ROW LEVEL SECURITY;`);
  console.log('  [OK] RLS enabled');

  // 8. RLS policies for invites
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Service role full access on invites" ON invites
        FOR ALL USING (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await runSQL(`
    DO $$ BEGIN
      CREATE POLICY "Anon read pending invites" ON invites
        FOR SELECT USING (status = 'pending' AND expires_at > now());
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  console.log('  [OK] RLS policies');

  // 9. Indexes
  await runSQL(`CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);`);
  await runSQL(`CREATE INDEX IF NOT EXISTS idx_invites_lead_id ON invites(lead_id);`);
  console.log('  [OK] Indexes');

  // 10. Verify
  const profiles = await runSQL(`SELECT count(*) as cnt FROM profiles;`);
  const invites = await runSQL(`SELECT count(*) as cnt FROM invites;`);
  console.log('\n=== Verification ===');
  console.log('  profiles count:', JSON.stringify(profiles));
  console.log('  invites count:', JSON.stringify(invites));

  console.log('\nDone!');
}

main().catch(console.error);
