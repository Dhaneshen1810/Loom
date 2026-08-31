ALTER TABLE users
ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

UPDATE users
SET role = 'admin'
WHERE email = 'dan.moonian@gmail.com';
