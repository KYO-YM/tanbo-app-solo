// ポリゴン座標（GeoJSON: [lon, lat][]）から面積(m²)を計算
export function calcAreaM2(coordinates: number[][][]): number {
  const ring = coordinates[0]
  if (ring.length < 3) return 0

  const meanLat = ring.reduce((s, c) => s + c[1], 0) / ring.length
  const mPerLon = 111320 * Math.cos((meanLat * Math.PI) / 180)
  const mPerLat = 111320

  let area = 0
  const n = ring.length
  for (let i = 0; i < n - 1; i++) {
    const x1 = ring[i][0] * mPerLon
    const y1 = ring[i][1] * mPerLat
    const x2 = ring[i + 1][0] * mPerLon
    const y2 = ring[i + 1][1] * mPerLat
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

// m² → 表示文字列（ア / ha）
export function formatArea(m2: number): string {
  if (m2 <= 0) return '-'
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(2)} ha`
  const a = m2 / 100
  const tsubo = Math.round(m2 / 3.30579)
  return `${a.toFixed(1)} a（${tsubo}坪）`
}
