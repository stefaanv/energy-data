CREATE TABLE `consumption` (
	`periodStart` integer PRIMARY KEY NOT NULL,
	`periodEnd` integer,
	`value` real
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE TABLE `electricity-prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractId` integer,
	`periodStart` integer,
	`periodEnd` integer,
	`price` real
);
