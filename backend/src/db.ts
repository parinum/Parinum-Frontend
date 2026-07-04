import { Pool, type QueryResultRow } from 'pg'
import { requireDatabaseUrl, env } from './env'
import { schemaSql } from './schema'

export const pool = new Pool({
  connectionString: requireDatabaseUrl(),
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
})

export const query = <T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) =>
  pool.query<T>(text, values)

export const migrate = async () => {
  await pool.query(schemaSql)
}

export const closePool = async () => {
  await pool.end()
}
