-- =====================================================
-- SEED DATA - Soiling Calc
-- =====================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este script completo
-- 3. Ejecuta (Run)
-- =====================================================
-- NOTA: Para seeds mas completas con lecturas y fisica real,
-- usar el script Node.js: scripts/seed-readings.js
-- =====================================================

-- Crear usuario admin de prueba
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES
  ('6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7', '00000000-0000-0000-0000-000000000000', 'admin@soiling.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES
  ('6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7', '6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7', '{"sub":"6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7","email":"admin@soiling.test"}', 'email', '6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insertar en tabla users (trial activo por 30 dias)
INSERT INTO users (id, email, trial_ends_at, created_at)
VALUES
  ('6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7', 'admin@soiling.test', now() + interval '30 days', now())
ON CONFLICT (id) DO NOTHING;

-- Planta de ejemplo: 10 kWp residencial en Madrid
INSERT INTO plants (
  id, user_id, name, latitude, longitude,
  num_modules, module_power_w, module_area_m2,
  tilt_deg, azimuth_deg, noct_celsius,
  temp_coeff_pmax, energy_price_eur, cleaning_cost_eur,
  created_at
) VALUES (
  '17a0f33e-a177-4d6a-942e-013890d6075a',
  '6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7',
  'Residencial Madrid 10kWp',
  40.416, -3.703,
  24, 415, 1.92,
  30, 180, 45,
  -0.35, 0.08, 120.00,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Verificar datos insertados
SELECT 'users:' as tabla, count(*) as total FROM users;
SELECT 'plants:' as tabla, count(*) as total FROM plants;

-- =====================================================
-- CREDENCIALES DE PRUEBA:
-- Email: admin@soiling.test | Password: password123
-- =====================================================
