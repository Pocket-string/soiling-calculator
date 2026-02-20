/**
 * Genera demo-case.json para Santiago, Chile con 7 paneles de 650W
 * Usa las mismas formulas del motor NOCT de soilingCalculator.ts
 */

const PLANT = {
  id: "demo-plant-santiago-001",
  user_id: "demo-user",
  name: "Instalacion Solar Santiago",
  latitude: -33.433981,
  longitude: -70.538166,
  num_modules: 7,
  module_power_wp: 650,
  module_area_m2: 2.3,
  total_power_kw: 4.55,
  total_area_m2_calc: 16.1,
  tilt_degrees: 20,
  azimuth_degrees: 0,
  noct: 45,
  temp_coeff_percent: -0.4,
  module_efficiency: 0.20,
  energy_price_eur: 0.15,
  cleaning_cost_eur: 80,
  currency: "CLP",
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z"
};

// --- Soiling Calculator formulas (mirror of soilingCalculator.ts) ---

function calcCellTemperature(tempAmbient_c, noct, poa_w_m2) {
  return tempAmbient_c + ((noct - 20) / 800) * poa_w_m2;
}

function calcTempCorrectedPower(totalPowerKw, tCellC, tempCoeffPercent) {
  return totalPowerKw * (1 + (tCellC - 25) * (tempCoeffPercent / 100));
}

function convertGhiToPoa(ghi_kwh_m2, tilt_degrees) {
  const tiltRad = (tilt_degrees * Math.PI) / 180;
  const poaFactor = 1 + Math.sin(tiltRad) * 0.15;
  const poa_kwh_m2 = ghi_kwh_m2 * poaFactor;
  const poa_w_m2_equivalent = (poa_kwh_m2 * 1000) / 8;
  return { poa_kwh_m2, poa_w_m2_equivalent };
}

function calcTheoKwh(ghi, tempAmb) {
  const { poa_w_m2_equivalent } = convertGhiToPoa(ghi, PLANT.tilt_degrees);
  const tCell = calcCellTemperature(tempAmb, PLANT.noct, poa_w_m2_equivalent);
  const pTemp = calcTempCorrectedPower(PLANT.total_power_kw, tCell, PLANT.temp_coeff_percent);
  const pClip = PLANT.total_power_kw * 1.10;
  const pEff = Math.max(0, Math.min(pTemp, pClip));
  const kwhTheo = pEff * ghi;
  return { t_cell_c: tCell, kwh_theoretical: Math.max(0, kwhTheo) };
}

// --- Reading definitions for Santiago, Chile ---
// Southern hemisphere: summer=Dec-Feb, winter=Jun-Aug
// [date, ghi_kwh_m2, temp_ambient_c, is_cleaning_day, soiling_pct]
const defs = [
  // Cycle 1: Feb 1 cleaning (late summer), soiling builds through April
  ["2025-02-01", 7.2, 29, true,  0],
  ["2025-02-15", 6.8, 28, false, 1.5],
  ["2025-02-28", 6.5, 27, false, 3.0],
  ["2025-03-10", 5.8, 24, false, 4.2],
  ["2025-03-20", 5.2, 22, false, 5.5],
  ["2025-03-30", 4.6, 19, false, 6.8],
  ["2025-04-10", 4.0, 17, false, 7.8],
  ["2025-04-20", 3.5, 15, false, 8.8],
  ["2025-04-30", 3.1, 13, false, 9.8],

  // Cycle 2: May 1 cleaning (autumn), soiling builds through July
  ["2025-05-01", 2.8, 12, true,  0],
  ["2025-05-15", 2.5, 10, false, 1.3],
  ["2025-05-31", 2.2, 8,  false, 2.5],
  ["2025-06-10", 2.0, 7,  false, 3.5],
  ["2025-06-20", 1.9, 6,  false, 4.5],
  ["2025-06-30", 1.8, 5,  false, 5.5],
  ["2025-07-10", 1.9, 6,  false, 6.5],
  ["2025-07-20", 2.1, 7,  false, 7.5],
  ["2025-07-31", 2.3, 8,  false, 8.5],

  // Cycle 3: Aug 1 cleaning (late winter), soiling builds through October
  ["2025-08-01", 2.5, 9,  true,  0],
  ["2025-08-15", 3.0, 11, false, 1.2],
  ["2025-08-31", 3.5, 13, false, 2.5],
  ["2025-09-10", 4.2, 15, false, 3.8],
  ["2025-09-20", 4.8, 17, false, 5.0],
  ["2025-09-30", 5.3, 19, false, 6.2],
  ["2025-10-10", 5.8, 21, false, 7.3],
  ["2025-10-20", 6.2, 23, false, 8.3],
  ["2025-10-31", 6.5, 24, false, 9.3],

  // Cycle 4: Nov 1 cleaning (spring), soiling builds through January 2026
  ["2025-11-01", 6.6, 22, true,  0],
  ["2025-11-15", 6.9, 24, false, 1.4],
  ["2025-11-30", 7.2, 26, false, 2.8],
  ["2025-12-10", 7.5, 28, false, 4.0],
  ["2025-12-20", 7.8, 30, false, 5.2],
  ["2025-12-30", 7.6, 31, false, 6.3],
  ["2026-01-10", 7.4, 30, false, 7.4],
  ["2026-01-20", 7.2, 29, false, 8.4],
  ["2026-01-30", 7.0, 28, false, 9.4],
];

// --- Helper: days between two YYYY-MM-DD strings ---
function daysDiff(a, b) {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db - da) / 86_400_000);
}

// --- Generate readings ---
let prBaseline = null;
let cumulativeLossEur = 0;
let lastReadingDate = null;
let lastLossEur = 0;
const readings = [];

for (let i = 0; i < defs.length; i++) {
  const [date, ghi, tempAmb, isCleaning, soilingPct] = defs[i];
  const { t_cell_c, kwh_theoretical } = calcTheoKwh(ghi, tempAmb);

  // Clean PR varies by temperature (hotter = more thermal loss)
  const cleanPR = tempAmb > 25 ? 0.83 : tempAmb > 15 ? 0.85 : 0.87;

  if (isCleaning) {
    prBaseline = cleanPR;
    cumulativeLossEur = 0;
    lastReadingDate = null;
    lastLossEur = 0;
  }

  const prCurrent = isCleaning ? cleanPR : prBaseline * (1 - soilingPct / 100);
  const kwhReal = kwh_theoretical * prCurrent;
  const kwhLoss = kwh_theoretical - kwhReal;
  const lossPct = kwh_theoretical > 0 ? (kwhLoss / kwh_theoretical) * 100 : 0;
  const lossEur = kwhLoss * PLANT.energy_price_eur;
  const soiling = isCleaning ? 0 : soilingPct;

  // Trapezoidal interpolation: estimate losses for days between readings
  if (lastReadingDate) {
    const gapDays = daysDiff(lastReadingDate, date) - 1;
    if (gapDays > 0) {
      cumulativeLossEur += gapDays * (lastLossEur + lossEur) / 2;
    }
  }
  cumulativeLossEur += lossEur;
  lastReadingDate = date;
  lastLossEur = lossEur;

  // Cleaning recommendation (same thresholds as soilingCalculator.ts)
  const dailyLossEur = kwh_theoretical * (soiling / 100) * PLANT.energy_price_eur;
  const remaining = PLANT.cleaning_cost_eur - cumulativeLossEur;
  const daysBreakeven = remaining <= 0
    ? 0
    : dailyLossEur > 0 ? Math.ceil(remaining / dailyLossEur) : 9999;

  let rec;
  if (soiling > 15 || cumulativeLossEur > PLANT.cleaning_cost_eur * 2) {
    rec = "URGENT";
  } else if (soiling > 7 || cumulativeLossEur > PLANT.cleaning_cost_eur * 0.8) {
    rec = "RECOMMENDED";
  } else if (soiling > 3) {
    rec = "WATCH";
  } else {
    rec = "OK";
  }

  readings.push({
    id: `demo-r-${String(i + 1).padStart(2, "0")}`,
    plant_id: PLANT.id,
    user_id: "demo-user",
    reading_date: date,
    kwh_real: +kwhReal.toFixed(4),
    reading_type: "DAILY",
    is_cleaning_day: isCleaning,
    irradiance_kwh_m2: ghi,
    poa_w_m2: null,
    temp_ambient_c: tempAmb,
    t_cell_c: +t_cell_c.toFixed(4),
    kwh_theoretical: +kwh_theoretical.toFixed(4),
    kwh_loss: +kwhLoss.toFixed(4),
    loss_percent: +lossPct.toFixed(1),
    loss_eur: +lossEur.toFixed(4),
    pr_current: +prCurrent.toFixed(4),
    pr_baseline: +prBaseline.toFixed(4),
    soiling_percent: soiling,
    cumulative_loss_kwh: null,
    cumulative_loss_eur: +cumulativeLossEur.toFixed(4),
    cleaning_recommendation: rec,
    days_to_breakeven: daysBreakeven,
    created_at: `${date}T12:00:00Z`,
  });
}

console.log(JSON.stringify({ plant: PLANT, readings }, null, 2));
