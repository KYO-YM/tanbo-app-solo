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
    <>
      {/* モバイル: 背景オーバーレイ */}
      <div className="sm:hidden fixed inset-0 z-[999] bg-black/20" onClick={onClose} />
      <div className="
        fixed sm:absolute
        bottom-0 sm:bottom-4
        left-0 sm:left-auto
        right-0 sm:right-4
        sm:w-80
        bg-white
        rounded-t-2xl sm:rounded-xl
        shadow-2xl sm:shadow-lg
        z-[1000]
        max-h-[70vh] sm:max-h-none
        flex flex-col
      ">
        {/* ドラッグハンドル（モバイル） */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="p-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-gray-800 text-base">{field.name}</h2>
              {field.owner && <p className="text-sm text-gray-500">{field.owner}</p>}
              {field.area_ha && (
                <p className="text-sm text-gray-500">{(field.area_ha * 100).toFixed(1)} アール</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 p-1.5 -m-1.5"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="px-4 space-y-2 overflow-y-auto flex-1">
          {workTypes.map(wt => {
            const record = workRecords.find(r => r.work_type_id === wt.id)
            const status = record?.status ?? 'none'
            return (
              <div key={wt.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: wt.color }} />
                  <span className="text-sm text-gray-700">{wt.name}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  status === 'done'        ? 'bg-green-100 text-green-700' :
                  status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  status === 'pending'     ? 'bg-gray-100 text-gray-600' :
                                             'bg-gray-50 text-gray-400'
                }`}>
                  {status === 'none' ? '未登録' : STATUS_LABELS[status]}
                </span>
              </div>
            )
          })}
        </div>
        <div className="p-4 flex-shrink-0 border-t mt-2">
          <Link
            href={`/fields/${field.id}`}
            className="block text-center text-sm text-white font-medium bg-green-600 hover:bg-green-700 rounded-xl py-3 transition-colors"
          >
            詳細・作業記録を見る →
          </Link>
        </div>
      </div>
    </>
  )
}
