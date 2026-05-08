export const STATUS_COLORS = {
  pending:     '#9ca3af',
  in_progress: '#fbbf24',
  done:        '#22c55e',
  none:        '#e5e7eb',
} as const

export const STATUS_LABELS = {
  pending:     '未着手',
  in_progress: '進行中',
  done:        '完了',
} as const

export const DEFAULT_MAP_CENTER: [number, number] = [36.2048, 138.2529]
export const DEFAULT_MAP_ZOOM = 13
