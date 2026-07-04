const fs = require('fs');
const { Pool } = require('pg');

const env = Object.fromEntries(
  fs.readFileSync('/opt/parinum-profile-indexer/.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.trim().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

const pool = new Pool({
  connectionString: env.PROFILE_INDEXER_DATABASE_URL,
  ssl: env.PROFILE_INDEXER_DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const updates = [
  { chainId: 1, startBlock: 23914921 },
  { chainId: 56, startBlock: 70060934 },
  { chainId: 137, startBlock: 79721081 },
];

(async () => {
  const sql = "update sync_checkpoints set sync_mode='backfill', next_from_block=$2::bigint, last_scanned_block=$2::bigint-1, last_finalized_block=$2::bigint-1, last_seen_block_hash=null, consecutive_failures=0, last_error=null, updated_at=now() where chain_id=$1::int";

  for (const u of updates) {
    const res = await pool.query(sql, [u.chainId, u.startBlock]);
    console.log('updated', u.chainId, 'rows', res.rowCount, 'start', u.startBlock);
  }

  const verify = await pool.query(
    "select chain_id, next_from_block, last_scanned_block, consecutive_failures, left(coalesce(last_error,''),70) as last_error_prefix from sync_checkpoints where chain_id in (1,56,137) order by chain_id asc"
  );

  for (const row of verify.rows) {
    console.log(JSON.stringify(row));
  }

  await pool.end();
})().catch(async (e) => {
  console.error(e);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
