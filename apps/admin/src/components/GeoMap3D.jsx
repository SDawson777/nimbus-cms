import React, {useMemo} from 'react'
import Map from 'react-map-gl'
import DeckGL from '@deck.gl/react'
import {ColumnLayer} from '@deck.gl/layers'

/**
 * A 3D column map built with Deck.gl and react-map-gl.
 * Pass `data` as an array of objects containing `coordinates: [lng, lat]` and `value`.
 * Requires MAPBOX access token (set `VITE_MAPBOX_TOKEN` or `REACT_APP_MAPBOX_TOKEN` in your env).
 */
export default function GeoMap3D({
  data = [],
  longitude = -83.0458,
  latitude = 42.3314,
  zoom = 4,
  pitch = 45,
  bearing = -27,
  mapboxToken,
}) {
  const token =
    mapboxToken ||
    import.meta.env.VITE_MAPBOX_TOKEN ||
    import.meta.env.REACT_APP_MAPBOX_TOKEN ||
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    import.meta.env.REACT_APP_MAPBOX_ACCESS_TOKEN ||
    ''

  const layers = useMemo(
    () => [
      new ColumnLayer({
        id: 'column-layer',
        data,
        diskResolution: 12,
        radius: 5000,
        extruded: true,
        pickable: true,
        getPosition: (d) => d.coordinates,
        getElevation: (d) => d.value,
        getFillColor: [48, 128, 200],
        getLineColor: [80, 80, 80],
        elevationScale: 30,
      }),
    ],
    [data],
  )

  if (!token) {
    return (
      <div className="map-placeholder" style={{padding: '1rem'}}>
        <p style={{margin: 0, color: 'var(--muted)'}}>
          Add a Mapbox token (VITE_MAPBOX_TOKEN) to preview 3D geospatial insights.
        </p>
      </div>
    )
  }

  return (
    <div style={{width: '100%', height: 400}}>
      <DeckGL
        initialViewState={{longitude, latitude, zoom, pitch, bearing}}
        controller
        layers={layers}
      >
        <Map
          mapStyle="mapbox://styles/mapbox/light-v10"
          mapboxAccessToken={token}
          reuseMaps
          preventStyleDiffing
          style={{position: 'absolute', inset: 0}}
        />
      </DeckGL>
    </div>
  )
}
