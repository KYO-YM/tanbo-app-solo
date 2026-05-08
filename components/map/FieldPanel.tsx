'use client'
import Link from 'next/link'
import type { Field, WorkRecord, WorkType } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'
import { X } from 'lucide-react'

interface Props {
  field: Field
  workRecords: WorkRecord[]
  workTypes: WorkType[]
  onClose: () => void
}

export default function FieldPanel({ field, workRecords, workTypes, onClose }: Props) {
  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-xl shadow-lg p-4 z-[1000]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-bold text-gray-800">{field.name}</h2>
          {field.owner && <p className="text-sm text-gray-500">{field.owner}</p>}
          {field.area_ha && (
            <p className="text-sm text-gray-500">{(field.area_ha * 100).toFixed(1)} アール</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
          <X size={18} />
        </button>
      </div>
      <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
        {workTypes.map(wt => {
          const record = workRecords.find(r => r.work_type_id === wt.id)
          const status = record?.status ?? 'none'
          return (
            <div key={wt.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: wt.color }} />
                <span className="text-gray-700">{wt.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status === 'done'        ? 'bg-green-100 text-green-700' :
                status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                status === 'pending'     ? 'bg-gray-100 text-gray-600' :
                                           'bg-gray-50 text-gray-400'
              }`}>
                {status === 'none' ? '-' : STATUS_LABELS[status]}
              </span>
            </div>
          )
        })}
      </div>
      <Link
        href={`/fields/${field.id}`}
        className="block text-center text-sm text-green-700 font-medium hover:underline border-t pt-2"
      >
        詳細・作業記録を見る →
      </Link>
    </div>
  )
}
