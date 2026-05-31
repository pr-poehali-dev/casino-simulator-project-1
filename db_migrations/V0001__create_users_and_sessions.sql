
CREATE TABLE t_p89119388_casino_simulator_pro.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  balance INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p89119388_casino_simulator_pro.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p89119388_casino_simulator_pro.users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
