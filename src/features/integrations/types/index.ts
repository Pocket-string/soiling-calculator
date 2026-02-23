export type InverterProvider = 'solaredge' | 'huawei'

export type SyncStatus = 'success' | 'partial' | 'error'

export interface InverterIntegration {
  id: string
  plant_id: string
  user_id: string
  provider: InverterProvider
  external_site_id: string | null
  is_active: boolean
  sync_enabled: boolean
  last_sync_at: string | null
  last_sync_status: SyncStatus | null
  last_sync_error: string | null
  last_sync_readings_count: number
  consecutive_failures: number
  next_sync_after: string | null
  created_at: string
  updated_at: string
}

export interface SolarEdgeCredentials {
  apiKey: string
  siteId: string
}

export interface HuaweiCredentials {
  userName: string
  systemCode: string
  region: 'eu5' | 'intl' | 'la5'
}

export type InverterCredentials = SolarEdgeCredentials | HuaweiCredentials

/** Raw daily energy data from an inverter API */
export interface InverterDailyReading {
  date: string       // YYYY-MM-DD
  kwh_real: number   // Total energy production in kWh
}
