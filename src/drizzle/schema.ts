import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// migraties aanmaken met npm exec drizzle-kit generate:sqlite --out src/migrations --schema src/drizzle/schema.ts
// in de root folder

export const electricityPrice = sqliteTable('electricity-prices', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  contractId: integer('contractId'),
  periodStart: integer('periodStart', { mode: 'timestamp' }),
  periodEnd: integer('periodEnd', { mode: 'timestamp' }),
  price: real('price'),
})

export const contract = sqliteTable('contracts', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name'),
})

export const consumption = sqliteTable('consumption', {
  periodStart: integer('periodStart', { mode: 'timestamp' }).primaryKey(),
  periodEnd: integer('periodEnd', { mode: 'timestamp' }),
  value: real('value'), // in Wh for a 5m period, + for consumption / - for injection
})
