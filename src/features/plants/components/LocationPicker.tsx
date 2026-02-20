'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
const DEFAULT_CENTER = { lat: -33.434, lng: -70.538 } // Santiago, Chile
const DEFAULT_ZOOM = 5

interface LocationPickerProps {
  defaultLatitude?: number
  defaultLongitude?: number
}

export function LocationPicker({ defaultLatitude, defaultLongitude }: LocationPickerProps) {
  // If no API key, show manual inputs
  if (!API_KEY) {
    return <ManualCoordinateInputs defaultLatitude={defaultLatitude} defaultLongitude={defaultLongitude} />
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <LocationPickerInner defaultLatitude={defaultLatitude} defaultLongitude={defaultLongitude} />
    </APIProvider>
  )
}

function ManualCoordinateInputs({ defaultLatitude, defaultLongitude }: LocationPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Latitud <span className="text-error-500">*</span>
        </label>
        <input
          name="latitude"
          type="number"
          step="0.0001"
          defaultValue={defaultLatitude}
          placeholder="Ej: 40.4168"
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Longitud <span className="text-error-500">*</span>
        </label>
        <input
          name="longitude"
          type="number"
          step="0.0001"
          defaultValue={defaultLongitude}
          placeholder="Ej: -3.7038"
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>
    </div>
  )
}

function LocationPickerInner({ defaultLatitude, defaultLongitude }: LocationPickerProps) {
  const hasDefault = defaultLatitude !== undefined && defaultLongitude !== undefined
  const [position, setPosition] = useState(
    hasDefault
      ? { lat: defaultLatitude, lng: defaultLongitude }
      : DEFAULT_CENTER
  )
  const [zoom, setZoom] = useState(hasDefault ? 17 : DEFAULT_ZOOM)

  const handlePositionChange = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng })
    setZoom(17)
  }, [])

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Ubicacion <span className="text-error-500">*</span>
      </label>

      {/* Autocomplete search */}
      <PlacesAutocomplete onPlaceSelect={handlePositionChange} />

      {/* Map */}
      <div className="h-[300px] rounded-lg overflow-hidden border border-border">
        <Map
          defaultCenter={position}
          defaultZoom={zoom}
          center={position}
          zoom={zoom}
          gestureHandling="greedy"
          mapTypeId="hybrid"
          mapId="location-picker"
          onClick={(e) => {
            if (e.detail.latLng) {
              handlePositionChange(e.detail.latLng.lat, e.detail.latLng.lng)
            }
          }}
          onZoomChanged={(e) => setZoom(e.detail.zoom)}
        >
          <DraggableMarker position={position} onDragEnd={handlePositionChange} />
        </Map>
      </div>

      {/* Coordinate display */}
      <p className="text-xs text-foreground-muted">
        Coordenadas: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        <span className="ml-2 text-foreground-muted">(haz clic en el mapa o arrastra el marcador)</span>
      </p>

      {/* Hidden form inputs */}
      <input type="hidden" name="latitude" value={position.lat} />
      <input type="hidden" name="longitude" value={position.lng} />
    </div>
  )
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: { lat: number; lng: number }
  onDragEnd: (lat: number, lng: number) => void
}) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const map = useMap()

  useEffect(() => {
    if (!markerRef.current) return
    const marker = markerRef.current
    marker.gmpDraggable = true

    const listener = marker.addListener('dragend', () => {
      const pos = marker.position
      if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') {
        onDragEnd(pos.lat, pos.lng)
      }
    })

    return () => {
      if (listener) google.maps.event.removeListener(listener)
    }
  }, [onDragEnd, map])

  return (
    <AdvancedMarker ref={markerRef} position={position} />
  )
}

function PlacesAutocomplete({
  onPlaceSelect,
}: {
  onPlaceSelect: (lat: number, lng: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const placesLib = useMapsLibrary('places')

  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ['geometry'],
      types: ['geocode'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        onPlaceSelect(
          place.geometry.location.lat(),
          place.geometry.location.lng()
        )
      }
    })
  }, [placesLib, onPlaceSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Buscar direccion..."
      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
    />
  )
}
