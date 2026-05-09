'use client'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Field, WorkRecord, WorkType } from '@/lib/supabase/types'
import { STATUS_COLORS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import FieldPanel from './FieldPanel'
import MapLegend from './MapLegend'
import FieldSelectorPanel from './FieldSelectorPanel'

interface Props {
  fields: Field[]
  workRecords: WorkRecord[]
  workTypes: WorkType[]
  selectedWorkTypeId: string | null
}

export default function MapView({ fields, workRecords, workTypes, selectedWorkTypeId }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<L.Layer[]>([])
  const [selectedField, setSelectedField] = useState<Field | null>(null)
  const [localRecords, setLocalRecords] = useState<WorkRecord[]>(workRecords)

  useRealtimeSync(['work_records', 'fields'], setLocalRecords)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = L.map(containerRef.current).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []

    fields.forEach(field => {
      const color = getFieldColor(field.id, localRecords, selectedWorkTypeId)
      const polygon = L.geoJSON(field.geometry as GeoJSON.Geometry, {
        style: {
          fillColor: color,
          fillOpacity: 0.65,
          color: '#374151',
          weight: 1.5,
        },
      })
        .on('click', () => setSelectedField(field))
        .addTo(mapRef.current!)
      layersRef.current.push(polygon)
    })

    // 田んぼが1件以上あれば全体が見えるようズーム
    if (fields.length > 0 && layersRef.current.length > 0) {
      const group = L.featureGroup(layersRef.current)
      mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40] })
    }
  }, [fields, localRecords, selectedWorkTypeId])

  function handleFieldSelect(field: Field) {
    setSelectedField(field)
    if (!mapRef.current) return
    const layer = L.geoJSON(field.geometry as GeoJSON.Geometry)
    mapRef.current.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 17 })
  }

  return (
    <div className="relative w-full h-[calc(100vh-56px)]">
      <div ref={containerRef} className="w-full h-full" />
      <MapLegend />
      <FieldSelectorPanel
        fields={fields}
        workRecords={localRecords}
        selectedWorkTypeId={selectedWorkTypeId}
        onSelect={handleFieldSelect}
      />
      {selectedField && (
        <FieldPanel
          field={selectedField}
          workRecords={localRecords.filter(r => r.field_id === selectedField.id)}
          workTypes={workTypes}
          onClose={() => setSelectedField(null)}
        />
      )}
    </div>
  )
}

function getFieldColor(
  fieldId: string,
  workRecords: WorkRecord[],
  selectedWorkTypeId: string | null
): string {
  if (!selectedWorkTypeId) {
    const records = workRecords.filter(r => r.field_id === fieldId)
    if (records.length === 0) return STATUS_COLORS.none
    if (records.some(r => r.status === 'pending'))     return STATUS_COLORS.pending
    if (records.some(r => r.status === 'in_progress')) return STATUS_COLORS.in_progress
    return STATUS_COLORS.done
  }
  const record = workRecords.find(
    r => r.field_id === fieldId && r.work_type_id === selectedWorkTypeId
  )
  if (!record) return STATUS_COLORS.none
  return STATUS_COLORS[record.status]
}
