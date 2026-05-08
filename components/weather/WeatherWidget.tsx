import { Cloud, Sun, CloudRain, CloudSnow, Zap, Wind, Droplets } from 'lucide-react'

interface WeatherDay {
  date: string
  code: number
  maxTemp: number
  minTemp: number
  precipitation: number
}

function weatherInfo(code: number): { label: string; emoji: string; color: string } {
  if (code === 0) return { label: '快晴', emoji: '☀️', color: 'text-yellow-500' }
  if (code <= 3) return { label: code === 1 ? '晴れ' : code === 2 ? '一部曇り' : '曇り', emoji: code === 3 ? '☁️' : '⛅', color: 'text-blue-400' }
  if (code <= 48) return { label: '霧', emoji: '🌫️', color: 'text-gray-400' }
  if (code <= 67) return { label: '雨', emoji: '🌧️', color: 'text-blue-500' }
  if (code <= 77) return { label: '雪', emoji: '❄️', color: 'text-blue-200' }
  if (code <= 82) return { label: 'にわか雨', emoji: '🌦️', color: 'text-blue-400' }
  if (code <= 86) return { label: '雪のにわか', emoji: '🌨️', color: 'text-blue-200' }
  return { label: '雷雨', emoji: '⛈️', color: 'text-purple-500' }
}

function formatDate(dateStr: string, index: number): string {
  if (index === 0) return '今日'
  if (index === 1) return '明日'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface Props {
  lat: number
  lon: number
  locationName?: string
}

export default async function WeatherWidget({ lat, lon, locationName }: Props) {
  let days: WeatherDay[] = []
  let error = false

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FTokyo&forecast_days=7`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (res.ok) {
      const json = await res.json()
      days = json.daily.time.map((date: string, i: number) => ({
        date,
        code: json.daily.weathercode[i],
        maxTemp: Math.round(json.daily.temperature_2m_max[i]),
        minTemp: Math.round(json.daily.temperature_2m_min[i]),
        precipitation: json.daily.precipitation_sum[i],
      }))
    } else {
      error = true
    }
  } catch {
    error = true
  }

  if (error || days.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 text-sm text-gray-400">
        天気情報を取得できませんでした
      </div>
    )
  }

  const today = days[0]
  const todayInfo = weatherInfo(today.code)

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl shadow p-4 border border-blue-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">天気予報</h2>
          {locationName && <p className="text-xs text-gray-400 mt-0.5">{locationName}</p>}
        </div>
        <span className="text-xs text-gray-400">{today.date}</span>
      </div>

      {/* 今日の天気（大きく表示） */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl">{todayInfo.emoji}</span>
        <div>
          <div className="text-sm font-medium text-gray-700">{todayInfo.label}</div>
          <div className="text-2xl font-bold text-gray-800">
            {today.maxTemp}° <span className="text-base font-normal text-gray-400">{today.minTemp}°</span>
          </div>
          {today.precipitation > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <Droplets size={11} />
              {today.precipitation.toFixed(1)}mm
            </div>
          )}
        </div>
      </div>

      {/* 6日分の予報 */}
      <div className="grid grid-cols-6 gap-1">
        {days.slice(1).map((day, i) => {
          const info = weatherInfo(day.code)
          return (
            <div key={day.date} className="flex flex-col items-center text-center gap-0.5">
              <span className="text-xs text-gray-500">{formatDate(day.date, i + 1)}</span>
              <span className="text-lg">{info.emoji}</span>
              <span className="text-xs font-medium text-red-500">{day.maxTemp}°</span>
              <span className="text-xs text-blue-400">{day.minTemp}°</span>
              {day.precipitation > 0 && (
                <span className="text-[10px] text-blue-400">{day.precipitation.toFixed(0)}mm</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
