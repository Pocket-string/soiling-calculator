/**
 * Seed Script: 36 lecturas de producción para admin@soiling.test
 * Planta: Instalación Solar Madrid (8 kW, 40 m², Madrid)
 *
 * Física aplicada (idéntica al soilingCalculator.ts):
 * - POA: GHI * (1 + sin(30°) * 0.15) = GHI * 1.075
 * - NOCT: T_cell = T_amb + (NOCT-20)/800 * POA_W
 * - kwh_theoretical = min(P_temp, 8.8 kW) * POA_kWh
 * - soiling_pct = days_since_clean * 0.10% (0.7%/semana, típico Madrid)
 */

const https = require('https');

const USER_ID    = '6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7';
const PLANT_ID   = '17a0f33e-a177-4d6a-942e-013890d6075a';
const ACCESS_TOKEN = 'sbp_973064eec76c672c5ffb3b4c633f740e18301b9d';
const PROJECT_REF  = 'yduujlxtymhtnxcbwldh';

// ── Constantes de la planta ──────────────────────────────────────────────────
const TOTAL_POWER    = 8.0;   // kW
const NOCT           = 45.0;  // °C
const TEMP_COEFF     = -0.4;  // %/°C
const ENERGY_PRICE   = 0.12;  // €/kWh
const CLEANING_COST  = 150.0; // €
const CLIP_LIMIT     = TOTAL_POWER * 1.10; // 8.8 kW
const POA_FACTOR     = 1 + Math.sin(30 * Math.PI / 180) * 0.15; // ≈ 1.075

// ── Física ───────────────────────────────────────────────────────────────────
function calcNOCT(ghi, tAmb) {
  const poaKwh = ghi * POA_FACTOR;
  const poaW   = (poaKwh * 1000) / 8;
  const tCell  = tAmb + ((NOCT - 20) / 800) * poaW;
  const pTemp  = TOTAL_POWER * (1 + (tCell - 25) * (TEMP_COEFF / 100));
  const pEff   = Math.min(Math.max(pTemp, 0), CLIP_LIMIT);
  const kwhTh  = Math.max(0, pEff * poaKwh);
  return { poaKwh, poaW, tCell, kwhTh };
}

function calcRecommendation(soilingPct, cumEur, kwhTh) {
  const dailyLoss = kwhTh * (soilingPct / 100) * ENERGY_PRICE;
  const daysBev   = dailyLoss > 0 ? Math.ceil(CLEANING_COST / dailyLoss) : 9999;
  let rec;
  if (soilingPct > 15 || cumEur > CLEANING_COST * 2)         rec = 'URGENT';
  else if (soilingPct > 7 || cumEur > CLEANING_COST * 0.8)   rec = 'RECOMMENDED';
  else if (soilingPct > 3)                                     rec = 'WATCH';
  else                                                          rec = 'OK';
  return { rec, daysBev };
}

// ── Programa de 36 lecturas ───────────────────────────────────────────────────
// Formato: [fecha, ghi(kWh/m²/día), t_amb(°C), is_cleaning, días_desde_limpieza, pr_baseline?]
// Los 4 días de limpieza establecen el nuevo baseline (PR limpio estacional)
const SCHEDULE = [
  // CICLO 1: Feb-Apr 2025  │ Invierno/Primavera - Lluvia reciente, panel más limpio
  ['2025-02-01', 2.9, 8,  true,  0,  0.850],
  ['2025-02-15', 3.1, 9,  false, 14],
  ['2025-02-28', 3.5, 10, false, 27],
  ['2025-03-10', 4.2, 11, false, 37],
  ['2025-03-20', 4.5, 13, false, 47],
  ['2025-03-30', 4.8, 14, false, 57],
  ['2025-04-10', 5.4, 15, false, 68],
  ['2025-04-20', 5.7, 16, false, 78],
  ['2025-04-30', 5.9, 17, false, 88],

  // CICLO 2: May-Jul 2025  │ Verano - Mayor irradiancia, más calor = menor PR base
  ['2025-05-01', 6.3, 18, true,  0,  0.820],
  ['2025-05-15', 6.5, 19, false, 14],
  ['2025-05-31', 6.8, 21, false, 30],
  ['2025-06-10', 7.1, 23, false, 40],
  ['2025-06-20', 7.3, 25, false, 50],
  ['2025-06-30', 7.1, 26, false, 60],
  ['2025-07-10', 7.6, 28, false, 70],
  ['2025-07-20', 7.8, 30, false, 80],
  ['2025-07-31', 7.5, 30, false, 91],

  // CICLO 3: Ago-Oct 2025  │ Fin verano/Otoño - Polvillo seco, alta suciedad
  ['2025-08-01', 7.2, 27, true,  0,  0.820],
  ['2025-08-15', 7.0, 27, false, 14],
  ['2025-08-31', 6.5, 26, false, 30],
  ['2025-09-10', 5.6, 22, false, 40],
  ['2025-09-20', 5.3, 21, false, 50],
  ['2025-09-30', 5.0, 19, false, 60],
  ['2025-10-10', 4.2, 17, false, 70],
  ['2025-10-20', 3.9, 16, false, 80],
  ['2025-10-31', 3.6, 14, false, 91],

  // CICLO 4: Nov 2025-Ene 2026  │ Otoño/Invierno - Lluvia limpia, acumulación lenta
  ['2025-11-01', 2.6, 10, true,  0,  0.845],
  ['2025-11-15', 2.4, 9,  false, 14],
  ['2025-11-30', 2.2, 8,  false, 29],
  ['2025-12-10', 1.9, 7,  false, 39],
  ['2025-12-20', 2.0, 7,  false, 49],
  ['2025-12-30', 2.1, 8,  false, 59],
  ['2026-01-10', 2.2, 6,  false, 70],
  ['2026-01-20', 2.3, 7,  false, 80],
  ['2026-01-30', 2.4, 8,  false, 90],
];

// Índices de los días de limpieza
const CLEAN_INDICES = [0, 9, 18, 27];

// ── Calcular todos los registros ─────────────────────────────────────────────
function buildRecords() {
  const records = [];
  let prBaseline = 0.850;

  for (let i = 0; i < SCHEDULE.length; i++) {
    const [date, ghi, tAmb, isCleaning, daysOffset, prOverride] = SCHEDULE[i];
    const { poaKwh, poaW, tCell, kwhTh } = calcNOCT(ghi, tAmb);

    if (isCleaning) {
      prBaseline = prOverride;
    }

    const soilingPct = isCleaning ? 0.0 : daysOffset * 0.10;
    const prCurrent  = prBaseline * (1 - soilingPct / 100);
    const kwhReal    = kwhTh * prCurrent;
    const kwhLoss    = Math.max(0, kwhTh - kwhReal);
    const lossPct    = kwhTh > 0 ? kwhLoss / kwhTh : 0;
    const lossEur    = kwhLoss * ENERGY_PRICE;

    // Pérdidas acumuladas del ciclo actual
    // cycleStart = índice del día de limpieza de este ciclo
    const cycleStartIdx = CLEAN_INDICES.filter(ci => ci <= i).slice(-1)[0];
    let cumKwh = 0, cumEurPrev = 0;
    for (let j = cycleStartIdx + 1; j < i; j++) {
      cumKwh    += records[j].kwhLoss;
      cumEurPrev += records[j].lossEur;
    }
    const cumLossKwh = cumKwh;
    const cumLossEur = cumEurPrev + lossEur;

    const { rec, daysBev } = calcRecommendation(soilingPct, cumLossEur, kwhTh);

    records.push({
      date, isCleaning, soilingPct, prBaseline, prCurrent,
      ghi, poaKwh, poaW, tAmb, tCell, kwhTh, kwhReal,
      kwhLoss, lossPct, lossEur, cumLossKwh, cumLossEur,
      rec, daysBev,
    });
  }
  return records;
}

// ── Generar SQL ──────────────────────────────────────────────────────────────
function toSql(records) {
  const r = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;
  const escape = v => v === null ? 'NULL' : `'${v}'`;

  const lines = records.map(rec => {
    return [
      `'${rec.date}'::date`,
      `${r(rec.kwhReal)}`,
      `'DAILY'`,
      rec.isCleaning ? 'true' : 'false',
      `${r(rec.ghi)}`,      // irradiance_kwh_m2 = GHI
      `${r(rec.poaW)}`,     // poa_w_m2
      `${r(rec.tAmb)}`,     // temp_ambient_c
      `${r(rec.tCell)}`,    // t_cell_c
      `${r(rec.kwhTh)}`,    // kwh_theoretical
      `${r(rec.kwhLoss)}`,  // kwh_loss
      `${r(rec.lossPct)}`,  // loss_percent
      `${r(rec.lossEur)}`,  // loss_eur
      `${r(rec.prCurrent)}`,
      `${r(rec.prBaseline)}`,
      `${r(rec.soilingPct)}`,
      `${r(rec.cumLossKwh)}`,
      `${r(rec.cumLossEur)}`,
      escape(rec.rec),
      `${rec.daysBev}`,
    ].join(', ');
  });

  return `
-- Limpiar lecturas anteriores (excepto hoy)
DELETE FROM production_readings
WHERE plant_id = '${PLANT_ID}'
  AND reading_date < '2026-02-18'::date;

-- Insertar 36 lecturas de seed
INSERT INTO production_readings (
  plant_id, user_id,
  reading_date, kwh_real, reading_type, is_cleaning_day,
  irradiance_kwh_m2, poa_w_m2, temp_ambient_c, t_cell_c,
  kwh_theoretical, kwh_loss, loss_percent, loss_eur,
  pr_current, pr_baseline, soiling_percent,
  cumulative_loss_kwh, cumulative_loss_eur,
  cleaning_recommendation, days_to_breakeven
) VALUES
${lines.map(l => `  ('${PLANT_ID}', '${USER_ID}', ${l})`).join(',\n')};

SELECT COUNT(*) as total_inserted,
       MIN(reading_date) as desde,
       MAX(reading_date) as hasta,
       COUNT(*) FILTER (WHERE is_cleaning_day) as limpiezas,
       ROUND(AVG(soiling_percent)::numeric, 2) as soiling_promedio_pct,
       MAX(soiling_percent) as soiling_maximo_pct
FROM production_readings
WHERE plant_id = '${PLANT_ID}' AND reading_date < '2026-02-18'::date;
`;
}

// ── Ejecutar via Management API ──────────────────────────────────────────────
function executeQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Generando 36 registros seed para Instalación Solar Madrid...\n');

  const records = buildRecords();

  // Preview de los registros
  console.log('📋 Preview de registros calculados:');
  console.log('─'.repeat(90));
  console.log('Fecha       │ Limpieza │ GHI   │ kWh_th │ kWh_real│ PR_cur│ Soiling│ Recom');
  console.log('─'.repeat(90));
  records.forEach(r => {
    const clean = r.isCleaning ? '  ✓      ' : '         ';
    const date  = r.date;
    console.log(
      `${date} │${clean}│ ${r.ghi.toFixed(1).padStart(5)} │ ${r.kwhTh.toFixed(1).padStart(6)} │ ` +
      `${r.kwhReal.toFixed(1).padStart(7)} │ ${r.prCurrent.toFixed(3)} │ ` +
      `${r.soilingPct.toFixed(1).padStart(5)}% │ ${r.rec}`
    );
  });
  console.log('─'.repeat(90));
  console.log(`Total: ${records.length} registros\n`);

  const sql = toSql(records);

  console.log('🚀 Ejecutando INSERT via Supabase Management API...');
  try {
    const result = await executeQuery(sql);
    console.log('\n✅ Seed completado exitosamente!');
    console.log('📊 Resumen:');
    if (Array.isArray(result.data)) {
      result.data.forEach(row => {
        Object.entries(row).forEach(([k, v]) => {
          console.log(`   ${k}: ${v}`);
        });
      });
    } else {
      console.log(JSON.stringify(result.data, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
