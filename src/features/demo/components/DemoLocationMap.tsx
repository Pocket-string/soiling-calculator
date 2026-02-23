'use client'

import { useState } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps'
import { clientEnv } from '@/lib/env'

const API_KEY = clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

interface DemoLocationMapProps {
  latitude: number
  longitude: number
  plantName: string
  powerKw: number
}

export function DemoLocationMap({ latitude, longitude, plantName, powerKw }: DemoLocationMapProps) {
  const [infoOpen, setInfoOpen] = useState(true)
  const position = { lat: latitude, lng: longitude }

  if (!API_KEY) {
    return (
      <div className="h-[300px] rounded-lg bg-surface-alt border border-border flex items-center justify-center text-foreground-muted text-sm">
        Mapa no disponible (API key no configurada)
      </div>
    )
  }

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border border-border">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={position}
          defaultZoom={17}
          gestureHandling="cooperative"
          mapTypeId="hybrid"
          mapId="demo-location"
        >
          <AdvancedMarker position={position} onClick={() => setInfoOpen(true)} />

          {infoOpen && (
            <InfoWindow position={position} onCloseClick={() => setInfoOpen(false)}>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{plantName}</p>
                <p className="text-gray-600">{powerKw} kWp</p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  )
}
