'use client'
import dynamic from 'next/dynamic'
import type { Field, WorkRecord, WorkType } from '@/lib/supabase/types'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

interface Props {
  fields: Field[]
  workRecords: WorkRecord[]
  workTypes: WorkType[]
  selectedWorkTypeId: string | null
}

export default function MapClient(props: Props) {
  return <MapView {...props} />
}
