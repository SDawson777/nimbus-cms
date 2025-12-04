import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

function storesToGeoJson(stores = []) {
  return {
    type: 'FeatureCollection',
    features: stores.map((store) => ({
      type: 'Feature',
      properties: {
        engagement: store.engagement ?? store.views ?? 0,
        name: store.storeSlug,
      },
      geometry: {
        type: 'Point',
        coordinates: [store.longitude ?? 0, store.latitude ?? 0],
      },
    })),
  }
}

export default function Heatmap({ stores = [], token }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !token || !containerRef.current) return undefined

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-96, 37],
      zoom: 2.5,
    })

    map.on('load', () => {
      map.addSource('stores', {
        type: 'geojson',
        data: storesToGeoJson(stores),
      })

      map.addLayer({
        id: 'stores-heat',
        type: 'heatmap',
        source: 'stores',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'engagement'], 0, 0, 120, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 9, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 24],
          'heatmap-opacity': 0.85,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(59,130,246,0)',
            0.4,
            'rgba(59,130,246,0.6)',
            0.7,
            'rgba(56,189,248,0.8)',
            1,
            'rgba(16,185,129,0.95)',
          ],
        },
      })

      map.addLayer({
        id: 'stores-points',
        type: 'circle',
        source: 'stores',
        minzoom: 2,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'engagement'], 0, 3, 120, 12],
          'circle-color': 'rgba(56,189,248,0.9)',
          'circle-stroke-color': 'rgba(59,130,246,0.7)',
          'circle-stroke-width': 1,
        },
      })
    })

    mapRef.current = map
    return () => map.remove()
  }, [token, stores])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const updateData = () => {
      const source = map.getSource('stores')
      if (source) source.setData(storesToGeoJson(stores))
    }

    if (map.isStyleLoaded()) {
      updateData()
    } else {
      map.once('load', updateData)
    }
  }, [stores])

  return <div ref={containerRef} className="heatmap-container" />
}
