-- Add amount_due column if it doesn't exist
ALTER TABLE player_season_finances 
ADD COLUMN IF NOT EXISTS amount_due NUMERIC(10,2) DEFAULT 0;

-- Add payment_status column if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'partial', 'paid');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE player_season_finances 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';

-- Add last_payment_date column
ALTER TABLE player_season_finances 
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;

-- Add fee_per_game setting to seasons table
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS fee_per_game NUMERIC(10,2) DEFAULT 50.00;

-- Add is_active column to seasons if missing
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
