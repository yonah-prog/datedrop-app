-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  date_of_birth DATE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  age_verified BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (EXTRACT(YEAR FROM AGE(date_of_birth)) >= 18)
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  where_from VARCHAR,
  where_live VARCHAR,
  city VARCHAR,
  state VARCHAR,
  high_school VARCHAR,
  college VARCHAR,
  yeshiva_seminary VARCHAR,
  about_me TEXT,
  location_radius INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section INT CHECK (section >= 1 AND section <= 6),
  question_id INT,
  value JSONB,
  importance_weight VARCHAR DEFAULT 'somewhat',
  confidence INT DEFAULT 100,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, section, question_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user1_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly drop events table
CREATE TABLE IF NOT EXISTS weekly_drop_events (
  id SERIAL PRIMARY KEY,
  event_date TIMESTAMP NOT NULL UNIQUE,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drop opt-ins table
CREATE TABLE IF NOT EXISTS drop_opt_ins (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drop_event_id INT REFERENCES weekly_drop_events(id) ON DELETE CASCADE,
  opted_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, drop_event_id)
);

-- Profile moderation table
CREATE TABLE IF NOT EXISTS profile_moderation (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending',
  reviewed_by INT REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id SERIAL PRIMARY KEY,
  blocker_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_drop_opt_ins_user_id ON drop_opt_ins(user_id);
