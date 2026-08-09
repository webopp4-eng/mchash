-- CM HASH PostgreSQL schema

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  blockchain text NOT NULL,
  address text NOT NULL,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  token text NOT NULL,
  blockchain text NOT NULL,
  tx_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  token text NOT NULL,
  blockchain text NOT NULL,
  destination_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  requested_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  token text NOT NULL,
  blockchain text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  hash_rate numeric NOT NULL,
  duration_days int NOT NULL,
  cost numeric NOT NULL,
  progress numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE mining_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  mined_amount numeric DEFAULT 0,
  earnings numeric DEFAULT 0,
  last_update timestamptz DEFAULT now()
);

CREATE TABLE mining_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  profit_multiplier numeric NOT NULL,
  daily_rate numeric NOT NULL,
  hash_price numeric NOT NULL,
  contract_price numeric NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE,
  reward_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE wallet_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE blockchain_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tx_hash text NOT NULL,
  sender text NOT NULL,
  receiver text NOT NULL,
  amount numeric NOT NULL,
  token text NOT NULL,
  blockchain text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  verification_status text NOT NULL DEFAULT 'pending'
);

CREATE TABLE verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tx_hash text NOT NULL,
  amount numeric NOT NULL,
  token text NOT NULL,
  verified_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'verified'
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  details text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
