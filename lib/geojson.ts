import type { GeoJSONPolygon } from './supabase/types'

export interface FudeFeature {
  type: 'Feature'
  properties: {
    筆ポリゴンID?: string
    地目?: string
    面積?: number
    [key: string]: unknown
  }
  geometry: GeoJSONPolygon
}

export function parseFudeGeoJSON(text: string): FudeFeature[] {
  const json = JSON.parse(text)
  if (json.type !== 'FeatureCollection') throw new Error('FeatureCollectionではありません')
  return json.features.filter(
    (f: FudeFeature) => f.geometry?.type === 'Polygon'
  )
}

export function calcAreaHa(geometry: GeoJSONPolygon): number {
  const coords = geometry.coordinates[0]
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1])
  }
  const areaInDegrees = Math.abs(area) / 2
  return (areaInDegrees * 111000 * 111000) / 10000
}
