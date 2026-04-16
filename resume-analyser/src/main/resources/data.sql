INSERT INTO branches (id, name, code, location, country, timezone, is_active)
VALUES
  (1, 'Hyderabad', 'HYD', 'Hyderabad',  'India',     'IST', true),
  (2, 'USA',       'US',  'New York',   'USA',        'EST', true),
  (3, 'Dubai',     'DXB', 'Dubai',      'UAE',        'GST', true),
  (4, 'Singapore', 'SGP', 'Singapore',  'Singapore',  'SGT', true),
  (5, 'Pune',      'PNQ', 'Pune',       'India',      'IST', true)
ON CONFLICT (id) DO NOTHING;