-- Create ENUM types
CREATE TYPE season_status AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE registration_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE match_status AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED');
CREATE TYPE payment_tier AS ENUM ('FULL', 'HALF', 'PAY_ON_DAY');
CREATE TYPE pay_on_day_status AS ENUM ('PAID', 'OWES');

-- Season table
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status season_status DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Division table
CREATE TABLE IF NOT EXISTS divisions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tier_level INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(4),
  logo_url VARCHAR(500),
  manager_contact VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Player table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team Season Registration table
CREATE TABLE IF NOT EXISTS team_season_registrations (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  division_id INT REFERENCES divisions(id) ON DELETE SET NULL,
  status registration_status DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, season_id)
);

-- Match table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  season_id INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  division_id INT NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  home_team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  pitch_number INT NOT NULL DEFAULT 1,
  home_score INT,
  away_score INT,
  status match_status DEFAULT 'UPCOMING',
  matchweek INT DEFAULT 1,
  venue VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Player Season Finance table
CREATE TABLE IF NOT EXISTS player_season_finances (
  id SERIAL PRIMARY KEY,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  payment_tier payment_tier NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  games_credited INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, season_id)
);

-- Match Roster table
CREATE TABLE IF NOT EXISTS match_rosters (
  id SERIAL PRIMARY KEY,
  match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pay_on_day_status pay_on_day_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);
