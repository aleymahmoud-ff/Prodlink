export type UserRole = 'admin' | 'engineer' | 'approver' | 'viewer'
export type LineType = 'finished' | 'semi-finished'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ApprovalType = 'sequential' | 'parallel'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserLineAssignment {
  id: string
  user_id: string
  line_id: string
}

export interface Line {
  id: string
  name: string
  code: string
  type: LineType
  form_approver_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  code: string
  category: string | null
  unit_of_measure: string
  line_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithLine extends Product {
  lines?: Line
}

export interface Reason {
  id: string
  name: string
  type: 'waste' | 'damage' | 'reprocessing'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductionEntry {
  id: string
  line_id: string
  product_id: string
  quantity: number
  unit_of_measure: string
  batch_number: string | null
  notes: string | null
  created_by: string
  created_at: string
  // Calendar day (YYYY-MM-DD) this entry represents in the user's browser TZ.
  // Set explicitly on submit for new rows; backfilled from created_at in
  // factory TZ for legacy rows.
  production_date: string
}

export interface ProductionEntryWithRelations extends ProductionEntry {
  lines?: Line
  products?: Product
  profiles?: User
}

export interface WasteEntry {
  id: string
  line_id: string
  product_id: string
  quantity: number
  unit_of_measure: string
  batch_number: string | null
  reason_id: string
  notes: string | null
  app_approved: boolean
  form_approved: boolean
  approval_status: ApprovalStatus
  created_by: string
  created_at: string
}

export interface WasteEntryWithRelations extends WasteEntry {
  lines?: Line
  products?: Product
  reasons?: Reason
  profiles?: User
}

export interface DamageEntry {
  id: string
  line_id: string
  product_id: string
  quantity: number
  unit_of_measure: string
  batch_number: string | null
  reason_id: string
  notes: string | null
  created_by: string
  created_at: string
}

export interface DamageEntryWithRelations extends DamageEntry {
  lines?: Line
  products?: Product
  reasons?: Reason
  profiles?: User
}

export interface ReprocessingEntry {
  id: string
  line_id: string
  product_id: string
  quantity: number
  unit_of_measure: string
  batch_number: string | null
  reason_id: string
  notes: string | null
  created_by: string
  created_at: string
}

export interface ReprocessingEntryWithRelations extends ReprocessingEntry {
  lines?: Line
  products?: Product
  reasons?: Reason
  profiles?: User
}

export interface ApprovalLevel {
  id: string
  name: string
  level_order: number
  approval_type: ApprovalType
  is_active: boolean
  created_at: string
}

export interface ApprovalLevelAssignment {
  id: string
  approval_level_id: string
  user_id: string
}

export interface WasteApproval {
  id: string
  waste_entry_id: string
  approval_level_id: string
  approved_by: string | null
  status: ApprovalStatus
  comments: string | null
  created_at: string
  updated_at: string
}
