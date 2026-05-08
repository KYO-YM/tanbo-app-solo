import { createClient } from '@/lib/supabase/server'
import { Wheat } from 'lucide-react'
import type { Field, Harvest } from '@/lib/supabase/types'
import { calcAreaM2, formatArea } from '@/lib/utils/geo'
import HarvestClient from './HarvestClient'
import HarvestChart from './HarvestChart'

export default async function HarvestsPage() {
  const supabase = await createClient()

  const [{ data: fieldsData }, { data: harvestsData }] = await Promise.all([
    supabase.from('fields').select('*').order('name'),
    supabase.from('harvests').select('*'),
  ])

  const fields = (fieldsData ?? []) as Field[]
  const harvests = (harvestsData ?? []) as Harvest[]

  const fieldsWithArea = fields.map(f => ({
    ...f,
    areaM2: calcAreaM2(f.geometry.coordinates),
    areaLabel: formatArea(calcAreaM2(f.geometry.coordinates)),
  }))

  // グラフ用: 年別合計
  const yearTotals = Object.entries(
    harvests.reduce((acc, h) => {
      if (h.amount_kg) acc[h.year] = (acc[h.year] ?? 0) + h.amount_kg
      return acc
    }, {} as Record<number, number>)
  ).map(([year, kg]) => ({ year: parseInt(year), kg }))
    .sort((a, b) => a.year - b.year)
    .slice(-6) // 直近6年

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Wheat size={22} className="text-yellow-600" />
        <h1 className="text-xl font-bold text-gray-800">収穫量記録</h1>
      </div>
      {yearTotals.length >= 2 && <HarvestChart data={yearTotals} />}
      <HarvestClient fields={fieldsWithArea} initialHarvests={harvests} />
    </div>
  )
}
