CREATE TABLE `scores` (
	`run_id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`mode` text NOT NULL,
	`score` integer NOT NULL,
	`won` integer NOT NULL,
	`days_remaining` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scores_player_mode` ON `scores` (`player_id`,`mode`,`score`);--> statement-breakpoint
CREATE INDEX `scores_mode_score` ON `scores` (`mode`,`score`);