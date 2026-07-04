import { closePool, migrate } from './db'
import { env } from './env'
import { ProfileIndexer } from './indexer'
import { createApiServer } from './server'
import { getIndexedChains } from './chains'
import { runSeedFromCsv } from './seedFromCsv'

const chains = getIndexedChains()

const run = async () => {
  const command = process.argv[2] || 'serve'

  if (chains.length === 0) {
    throw new Error('No backend chains are configured. Set PROFILE_INDEXER_RPC_URL_* and PROFILE_INDEXER_CHAINS.')
  }

  await migrate()

  if (command === 'migrate') {
    console.log('Database schema is up to date.')
    await closePool()
    return
  }

  if (command === 'seed-csv') {
    await runSeedFromCsv(process.argv.slice(3))
    await closePool()
    console.log('CSV seed completed.')
    return
  }

  const indexer = new ProfileIndexer(chains)
  const server = createApiServer()

  if (command === 'backfill') {
    await indexer.runOnce()
    await closePool()
    console.log('Backfill pass completed.')
    return
  }

  const shutdown = async () => {
    indexer.stop()
    server.close(async () => {
      await closePool()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  void indexer.start()
  server.listen(env.port, env.host, () => {
    console.log(`Profile indexer listening on http://${env.host}:${env.port}`)
  })
}

void run().catch(async (error) => {
  console.error(error)
  await closePool().catch(() => undefined)
  process.exit(1)
})