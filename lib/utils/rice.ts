export interface RiceVariety {
  id: string
  name: string
  region: string
  daysToHeading: number
  daysToHarvest: number
  midDryStart: number
  midDryDuration: number
  panFertDaysBeforeHeading: number
}

export const VARIETIES: RiceVariety[] = [
  { id: 'koshihikari',  name: 'コシヒカリ',    region: '全国',     daysToHeading: 95,  daysToHarvest: 45, midDryStart: 40, midDryDuration: 10, panFertDaysBeforeHeading: 20 },
  { id: 'akitakomachi', name: 'あきたこまち',  region: '東北・北陸', daysToHeading: 88,  daysToHarvest: 43, midDryStart: 37, midDryDuration: 10, panFertDaysBeforeHeading: 20 },
  { id: 'hitomebore',   name: 'ひとめぼれ',    region: '東北',     daysToHeading: 90,  daysToHarvest: 44, midDryStart: 38, midDryDuration: 10, panFertDaysBeforeHeading: 20 },
  { id: 'nanatsuboshi', name: 'ななつぼし',    region: '北海道',   daysToHeading: 85,  daysToHarvest: 43, midDryStart: 35, midDryDuration: 10, panFertDaysBeforeHeading: 18 },
  { id: 'haenuki',      name: 'はえぬき',      region: '山形',     daysToHeading: 93,  daysToHarvest: 45, midDryStart: 40, midDryDuration: 10, panFertDaysBeforeHeading: 20 },
  { id: 'yumepirika',   name: 'ゆめぴりか',    region: '北海道',   daysToHeading: 88,  daysToHarvest: 44, midDryStart: 36, midDryDuration: 10, panFertDaysBeforeHeading: 18 },
  { id: 'tsuyahime',    name: 'つや姫',        region: '東北',     daysToHeading: 95,  daysToHarvest: 45, midDryStart: 40, midDryDuration: 10, panFertDaysBeforeHeading: 20 },
  { id: 'kinuhikari',   name: 'きぬひかり',    region: '近畿',     daysToHeading: 90,  daysToHarvest: 44, midDryStart: 38, midDryDuration: 10, panFertDaysBeforeHeading: 20 },
  { id: 'hinohikari',   name: 'ヒノヒカリ',    region: '西日本',   daysToHeading: 105, daysToHarvest: 48, midDryStart: 45, midDryDuration: 10, panFertDaysBeforeHeading: 22 },
  { id: 'nikomaru',     name: 'にこまる',      region: '九州',     daysToHeading: 100, daysToHarvest: 47, midDryStart: 43, midDryDuration: 10, panFertDaysBeforeHeading: 22 },
]

export interface RiceEvent {
  date: string
  label: string
  emoji: string
  fieldId: string
  fieldName: string
  variety: string
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function calcRiceSchedule(
  fieldId: string,
  fieldName: string,
  transplantDate: string,
  varietyId: string,
): RiceEvent[] {
  const v = VARIETIES.find(x => x.id === varietyId)
  if (!v) return []

  const heading = addDays(transplantDate, v.daysToHeading)
  return [
    { date: transplantDate,                                  label: '田植え',       emoji: '🌱', fieldId, fieldName, variety: v.name },
    { date: addDays(transplantDate, v.midDryStart),          label: '中干し開始',   emoji: '🌊', fieldId, fieldName, variety: v.name },
    { date: addDays(transplantDate, v.midDryStart + v.midDryDuration), label: '中干し終了', emoji: '💧', fieldId, fieldName, variety: v.name },
    { date: addDays(heading, -v.panFertDaysBeforeHeading),   label: '穂肥施用',     emoji: '🌿', fieldId, fieldName, variety: v.name },
    { date: heading,                                         label: '出穂期',       emoji: '🌾', fieldId, fieldName, variety: v.name },
    { date: addDays(heading, v.daysToHarvest),               label: '収穫目安',     emoji: '🚜', fieldId, fieldName, variety: v.name },
  ]
}

// 現在のフェーズを返す（田んぼ一覧バッジ用）
export function currentPhase(transplantDate: string, varietyId: string): string | null {
  const v = VARIETIES.find(x => x.id === varietyId)
  if (!v) return null
  const events = calcRiceSchedule('', '', transplantDate, varietyId)
  const today = new Date().toISOString().slice(0, 10)
  // 最後に過ぎたイベントを現在フェーズとして返す
  let phase: string | null = null
  for (const e of events) {
    if (e.date <= today) phase = `${e.emoji} ${e.label}`
  }
  return phase
}
