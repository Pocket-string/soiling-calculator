import type {
  InverterProvider,
  InverterCredentials,
  SolarEdgeCredentials,
  HuaweiCredentials,
  InverterDailyReading,
} from '../types'
import { fetchSolarEdgeDaily, testSolarEdgeConnection } from './solaredgeClient'
import { fetchHuaweiDaily, testHuaweiConnection } from './huaweiClient'

/**
 * Fetch daily readings from the appropriate inverter API based on provider.
 *
 * @param provider    - 'solaredge' | 'huawei'
 * @param credentials - Decrypted credentials matching the provider
 * @param externalSiteId - Site/station identifier in the external system
 * @param startDate   - YYYY-MM-DD inclusive
 * @param endDate     - YYYY-MM-DD inclusive
 */
export async function fetchInverterReadings(
  provider: InverterProvider,
  credentials: InverterCredentials,
  externalSiteId: string,
  startDate: string,
  endDate: string,
): Promise<InverterDailyReading[]> {
  switch (provider) {
    case 'solaredge':
      return fetchSolarEdgeDaily(
        credentials as SolarEdgeCredentials,
        startDate,
        endDate,
      )

    case 'huawei':
      return fetchHuaweiDaily(
        credentials as HuaweiCredentials,
        externalSiteId,
        startDate,
        endDate,
      )

    default: {
      const _exhaustive: never = provider
      throw new Error(`Unknown provider: ${_exhaustive}`)
    }
  }
}

/**
 * Test connection to an inverter API. Returns provider-specific metadata on success.
 */
export async function testInverterConnection(
  provider: InverterProvider,
  credentials: InverterCredentials,
): Promise<{ success: boolean; metadata?: Record<string, unknown>; error?: string }> {
  switch (provider) {
    case 'solaredge': {
      const result = await testSolarEdgeConnection(credentials as SolarEdgeCredentials)
      return {
        success: result.success,
        metadata: result.siteName ? { siteName: result.siteName } : undefined,
        error: result.error,
      }
    }

    case 'huawei': {
      const result = await testHuaweiConnection(credentials as HuaweiCredentials)
      return {
        success: result.success,
        metadata: result.stations ? { stations: result.stations } : undefined,
        error: result.error,
      }
    }

    default: {
      const _exhaustive: never = provider
      throw new Error(`Unknown provider: ${_exhaustive}`)
    }
  }
}
