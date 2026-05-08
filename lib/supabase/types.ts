export type WorkStatus = 'pending' | 'in_progress' | 'done'
export type UserRole = 'admin' | 'worker' | null

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface Field {
  id: string
  name: string
  owner: string | null
  area_ha: number | null
  geometry: GeoJSONPolygon
  fude_id: string | null
  notes: string | null
  next_water_check: string | null
  transplant_date: string | null
  variety: string | null
  target_kg_per_10a: number | null
  created_at: string
  updated_at: string
}

export interface WorkType {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface WorkRecord {
  id: string
  field_id: string
  work_type_id: string
  status: WorkStatus
  work_date: string | null
  assigned_to: string | null
  scheduled_at: string | null
  completed_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface Harvest {
  id: string
  field_id: string
  year: number
  amount_kg: number | null
  note: string | null
  created_at: string
}

export interface Profile {
  id: string
  name: string
  role: UserRole
  line_user_id: string | null
  line_link_code: string | null
  created_at: string
}

// Supabase ジェネリクス用の型定義
export type Database = {
  public: {
    Tables: {
      fields: {
        Row: Field
        Insert: Omit<Field, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Field, 'id'>>
        Relationships: []
      }
      work_types: {
        Row: WorkType
        Insert: Omit<WorkType, 'id' | 'created_at'>
        Update: Partial<Omit<WorkType, 'id'>>
        Relationships: []
      }
      work_records: {
        Row: WorkRecord
        Insert: Omit<WorkRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WorkRecord, 'id'>>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
