'use client'
import { Download } from 'lucide-react'
import type { Field } from '@/lib/supabase/types'

interface Props {
  fields: Field[]
}

export default function FieldsCsvExport({ fields }: Props) {
  function handleExport() {
    const header = ['田んぼ名', '所有者', '面積(a)', '筆ポリゴンID', '登録日']
    const rows = fields.map(f => [
      f.name,
      f.owner ?? '',
      f.area_ha != null ? (f.area_ha * 100).toFixed(1) : '',
      f.fude_id ?? '',
      f.created_at.slice(0, 10),
    ])
    const csv = [header, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `田んぼ一覧_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 border border-gray-300 hover:border-green-500 rounded-lg px-3 py-1.5 transition-colors"
    >
      <Download size={13} />
      CSV出力
    </button>
  )
}
