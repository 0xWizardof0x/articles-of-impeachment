import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const scores = sqliteTable('scores', {
 runId: text('run_id').primaryKey(),
 playerId: text('player_id').notNull(),
 name: text('name').notNull(),
 country: text('country').notNull(),
 mode: text('mode').notNull(),
 score: integer('score').notNull(),
 won: integer('won').notNull(),
 daysRemaining: integer('days_remaining').notNull(),
 createdAt: integer('created_at').notNull(),
}, table => [index('scores_player_mode').on(table.playerId, table.mode, table.score), index('scores_mode_score').on(table.mode, table.score)]);
