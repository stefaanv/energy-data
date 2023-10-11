import { Module } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { join } from 'path'

export const DRIZZLE_CONNECTION = 'DRIZZLE_CONNECTION'

@Module({
  imports: [],
  providers: [
    {
      provide: DRIZZLE_CONNECTION,
      useFactory: drizzleFactory,
    },
  ],
  exports: [DRIZZLE_CONNECTION],
})
export class DrizzleModule {}

function drizzleFactory() {
  const migrationsFolder = join(__dirname, '../../db')
  const dbFile = join(migrationsFolder, 'sqlite.db')
  const db = drizzle(new Database(dbFile), { schema })
  migrate(db, { migrationsFolder })
  return db
}
