import { pgTable, text, timestamp, integer, jsonb, uuid, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

export const stationAssets = pgTable('station_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspace: text('workspace').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  kind: text('kind').notNull(),
  category: text('category').notNull(),
  instructions: text('instructions').notNull(),
  version: integer('version').notNull().default(1),
  shareToken: uuid('share_token').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const stationVersions = pgTable('station_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').notNull().references(() => stationAssets.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  instructions: text('instructions').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [uniqueIndex('station_asset_version_unique').on(table.assetId, table.version)]);
export const stationSessions = pgTable('station_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspace: text('workspace').notNull(),
  title: text('title').notNull(),
  mode: text('mode').notNull(),
  model: text('model').notNull(),
  agent: text('agent'),
  input: text('input').notNull(),
  output: text('output'),
  remoteId: text('remote_id'),
  status: text('status').notNull().default('running'),
  usage: jsonb('usage').$type<{ input: number; output: number; cached: number }>(),
  skills: jsonb('skills').$type<{ ponytail: boolean; caveman: boolean }>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const stationProjects = pgTable('station_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspace: text('workspace').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const stationPreferences = pgTable('station_preferences', {
  workspace: text('workspace').primaryKey(),
  ponytail: boolean('ponytail').default(false).notNull(),
  caveman: boolean('caveman').default(false).notNull(),
  name: text('name').default('My workspace').notNull(),
});
