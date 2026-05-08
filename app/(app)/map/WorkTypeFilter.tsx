'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { WorkType } from '@/lib/supabase/types'

interface Props {
  workTypes: WorkType[]
  selectedId: string | null
}

export default function WorkTypeFilter({ workTypes, selectedId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('work_type', id)
    else params.delete('work_type')
    router.push(`/map?${params.toString()}`)
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
      <button
        onClick={() => select(null)}
        className={`px-3 py-2 rounded-full text-xs font-medium border shadow-sm transition-colors ${
          !selectedId
            ? 'bg-green-700 text-white border-green-700'
            : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
        }`}
      >
        すべて
      </button>
      {workTypes.map(wt => (
        <button
          key={wt.id}
          onClick={() => select(wt.id)}
          className={`px-3 py-2 rounded-full text-xs font-medium border shadow-sm transition-colors ${
            selectedId === wt.id
              ? 'text-white border-transparent'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
          style={selectedId === wt.id ? { backgroundColor: wt.color, borderColor: wt.color } : {}}
        >
          {wt.name}
        </button>
      ))}
    </div>
  )
}
