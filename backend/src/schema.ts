export const schemaSql = `
create table if not exists chains (
  chain_id integer primary key,
  chain_key text not null unique,
  name text not null,
  factory_address text not null,
  deployment_block bigint not null,
  finality_buffer_blocks integer not null default 20,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchases (
  chain_id integer not null references chains(chain_id),
  purchase_address text not null,
  buyer_address text not null,
  seller_address text not null,
  token_address text,
  symbol text,
  price_raw numeric(78, 0),
  collateral_raw numeric(78, 0),
  price_display text,
  collateral_display text,
  creation_tx_hash text not null,
  latest_tx_hash text not null,
  current_status text not null check (current_status in ('awaiting-confirmation', 'in-escrow', 'completed', 'aborted')),
  current_category text not null check (current_category in ('ongoing', 'history')),
  created_at_block bigint not null,
  updated_at_block bigint not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  last_event_name text not null,
  created_log_index integer not null,
  latest_log_index integer not null,
  inserted_at timestamptz not null default now(),
  primary key (chain_id, purchase_address)
);

create index if not exists purchases_buyer_idx
  on purchases (chain_id, buyer_address, updated_at desc);

create index if not exists purchases_seller_idx
  on purchases (chain_id, seller_address, updated_at desc);

create index if not exists purchases_status_idx
  on purchases (chain_id, current_status, updated_at desc);

create table if not exists purchase_events (
  id bigserial primary key,
  chain_id integer not null references chains(chain_id),
  purchase_address text not null,
  contract_address text not null,
  event_name text not null,
  lifecycle_stage text not null,
  block_number bigint not null,
  block_hash text not null,
  block_timestamp timestamptz not null,
  tx_hash text not null,
  tx_index integer,
  log_index integer not null,
  topics jsonb not null,
  data text,
  args jsonb not null,
  removed boolean not null default false,
  inserted_at timestamptz not null default now(),
  unique (chain_id, tx_hash, log_index)
);

create index if not exists purchase_events_purchase_idx
  on purchase_events (chain_id, purchase_address, block_number asc, log_index asc);

create index if not exists purchase_events_stage_idx
  on purchase_events (chain_id, lifecycle_stage, block_number desc);

create table if not exists sync_checkpoints (
  chain_id integer primary key references chains(chain_id),
  sync_mode text not null check (sync_mode in ('backfill', 'live')),
  next_from_block bigint not null,
  last_scanned_block bigint not null,
  last_finalized_block bigint not null,
  last_seen_block_hash text,
  consecutive_failures integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);
`
