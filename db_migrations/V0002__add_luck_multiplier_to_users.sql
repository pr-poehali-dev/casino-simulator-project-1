ALTER TABLE t_p89119388_casino_simulator_pro.users
  ADD COLUMN IF NOT EXISTS luck_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0;
