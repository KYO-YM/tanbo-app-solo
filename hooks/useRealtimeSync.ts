'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkRecord } from '@/lib/supabase/types'

export function useRealtimeSync(
  tables: string[],
  onWorkRecordChange: (updater: (prev: WorkRecord[]) => WorkRecord[]) => void
) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('realtime-sync')

    tables.forEach(table => {
      channel.on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        (payload: { eventType: string; new: WorkRecord; old: { id: string } }) => {
          if (table !== 'work_records') return
          if (payload.eventType === 'INSERT') {
            onWorkRecordChange(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            onWorkRecordChange(prev =>
              prev.map(r => r.id === payload.new.id ? payload.new : r)
            )
          } else if (payload.eventType === 'DELETE') {
            onWorkRecordChange(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
    })

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
