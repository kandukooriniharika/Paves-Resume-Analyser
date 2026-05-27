INSERT INTO branches (id, name, code, location, country, timezone, is_active)
VALUES
  (1, 'Hyderabad', 'HYD', 'Hyderabad',  'India',     'IST', true),
  (2, 'USA',       'US',  'New York',   'USA',        'EST', true),
  (3, 'Dubai',     'DXB', 'Dubai',      'UAE',        'GST', true),
  (4, 'Singapore', 'SGP', 'Singapore',  'Singapore',  'SGT', true),
  (5, 'Pune',      'PNQ', 'Pune',       'India',      'IST', true)
ON CONFLICT (id) DO NOTHING;

-- Default platform users (password = 'Paves@2024' bcrypt-hashed)
INSERT INTO users (full_name, email, password, role, is_active, created_at)
VALUES
  ('Platform Admin',   'admin@pavestechnologies.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lJWK', 'HR_ADMIN',       true, NOW()),
  ('Lead Recruiter',   'recruiter@pavestechnologies.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lJWK', 'RECRUITER',      true, NOW()),
  ('Hiring Manager',   'hm@pavestechnologies.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lJWK', 'HIRING_MANAGER', true, NOW())
ON CONFLICT (email) DO NOTHING;
