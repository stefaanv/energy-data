import { integer, numeric, real, sqliteTable } from 'drizzle-orm/sqlite-core'

export const energyPrices = sqliteTable('electricity-prices', {
  periodStart: integer('periodStart', { mode: 'timestamp' }).primaryKey(),
  periodEnd: integer('periodEnd', { mode: 'timestamp' }).primaryKey(),
  price: real('price'),
})
