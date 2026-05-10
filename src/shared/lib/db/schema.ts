import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  pgEnum,
  unique,
  date,
} from 'drizzle-orm/pg-core';

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'engineer', 'approver', 'viewer']);
export const lineTypeEnum = pgEnum('line_type', ['finished', 'semi-finished']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);
export const approvalTypeEnum = pgEnum('approval_type', ['sequential', 'parallel']);
export const reasonTypeEnum = pgEnum('reason_type', ['waste', 'damage', 'reprocessing']);

// ============================================
// PROFILES TABLE
// ============================================

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('engineer'),
  isActive: boolean('is_active').notNull().default(true),
  language: text('language').default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// LINES TABLE
// ============================================

export const lines = pgTable('lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  code: text('code').notNull().unique(),
  type: lineTypeEnum('type').notNull().default('finished'),
  formApproverId: uuid('form_approver_id').references(() => profiles.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// USER LINE ASSIGNMENTS
// ============================================

export const userLineAssignments = pgTable('user_line_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  lineId: uuid('line_id').notNull().references(() => lines.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.lineId),
]);

// ============================================
// PRODUCTS TABLE
// ============================================

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  category: text('category'),
  unitOfMeasure: text('unit_of_measure').notNull().default('unit'),
  lineId: uuid('line_id').references(() => lines.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// REASONS TABLE
// ============================================

export const reasons = pgTable('reasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  type: reasonTypeEnum('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.name, table.type),
]);

// ============================================
// PRODUCTION ENTRIES
// ============================================

export const productionEntries = pgTable('production_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  lineId: uuid('line_id').notNull().references(() => lines.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  batchNumber: text('batch_number'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Calendar day this entry represents in the user's browser TZ.
  // Distinct from createdAt; see specs/001-backdated-production-entries.
  productionDate: date('production_date', { mode: 'string' }).notNull().defaultNow(),
});

// ============================================
// DAMAGE ENTRIES
// ============================================

export const damageEntries = pgTable('damage_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  lineId: uuid('line_id').notNull().references(() => lines.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  batchNumber: text('batch_number'),
  reasonId: uuid('reason_id').notNull().references(() => reasons.id, { onDelete: 'restrict' }),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// REPROCESSING ENTRIES
// ============================================

export const reprocessingEntries = pgTable('reprocessing_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  lineId: uuid('line_id').notNull().references(() => lines.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  batchNumber: text('batch_number'),
  reasonId: uuid('reason_id').notNull().references(() => reasons.id, { onDelete: 'restrict' }),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// APPROVAL LEVELS
// ============================================

export const approvalLevels = pgTable('approval_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  levelOrder: integer('level_order').notNull().unique(),
  approvalType: approvalTypeEnum('approval_type').notNull().default('sequential'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// APPROVAL LEVEL ASSIGNMENTS
// ============================================

export const approvalLevelAssignments = pgTable('approval_level_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  approvalLevelId: uuid('approval_level_id').notNull().references(() => approvalLevels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.approvalLevelId, table.userId),
]);

// ============================================
// WASTE ENTRIES
// ============================================

export const wasteEntries = pgTable('waste_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  lineId: uuid('line_id').notNull().references(() => lines.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  batchNumber: text('batch_number'),
  reasonId: uuid('reason_id').notNull().references(() => reasons.id, { onDelete: 'restrict' }),
  notes: text('notes'),
  appApproved: boolean('app_approved').notNull().default(false),
  formApproved: boolean('form_approved').notNull().default(false),
  currentApprovalLevel: integer('current_approval_level').default(1),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// WASTE APPROVALS
// ============================================

export const wasteApprovals = pgTable('waste_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  wasteEntryId: uuid('waste_entry_id').notNull().references(() => wasteEntries.id, { onDelete: 'cascade' }),
  approvalLevelId: uuid('approval_level_id').notNull().references(() => approvalLevels.id, { onDelete: 'restrict' }),
  approvedBy: uuid('approved_by').references(() => profiles.id, { onDelete: 'set null' }),
  status: approvalStatusEnum('status').notNull().default('pending'),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.wasteEntryId, table.approvalLevelId),
]);

// ============================================
// SYSTEM SETTINGS
// ============================================

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Line = typeof lines.$inferSelect;
export type NewLine = typeof lines.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Reason = typeof reasons.$inferSelect;
export type NewReason = typeof reasons.$inferInsert;

export type ProductionEntry = typeof productionEntries.$inferSelect;
export type NewProductionEntry = typeof productionEntries.$inferInsert;

export type DamageEntry = typeof damageEntries.$inferSelect;
export type NewDamageEntry = typeof damageEntries.$inferInsert;

export type ReprocessingEntry = typeof reprocessingEntries.$inferSelect;
export type NewReprocessingEntry = typeof reprocessingEntries.$inferInsert;

export type WasteEntry = typeof wasteEntries.$inferSelect;
export type NewWasteEntry = typeof wasteEntries.$inferInsert;

export type ApprovalLevel = typeof approvalLevels.$inferSelect;
export type NewApprovalLevel = typeof approvalLevels.$inferInsert;

export type WasteApproval = typeof wasteApprovals.$inferSelect;
export type NewWasteApproval = typeof wasteApprovals.$inferInsert;

export type UserLineAssignment = typeof userLineAssignments.$inferSelect;
export type NewUserLineAssignment = typeof userLineAssignments.$inferInsert;

export type ApprovalLevelAssignment = typeof approvalLevelAssignments.$inferSelect;
export type NewApprovalLevelAssignment = typeof approvalLevelAssignments.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
