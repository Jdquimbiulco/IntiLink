CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

INSERT INTO roles (name, description, status) VALUES
  ('ADMIN', 'Administrator', 'active'),
  ('ANALYST', 'Analyst', 'active'),
  ('USER', 'User', 'active')
ON CONFLICT (name) DO NOTHING;

-- Usuario Administrador inicial para bootstrapping (contraseña: Admin123!)
INSERT INTO users (id, username, email, password_hash, status) VALUES
  ('039e38a8-4708-450a-b07d-8d8e9e7d07ea', 'admin', 'admin@intilink.com', '$argon2id$v=19$m=65536,t=3,p=4$Oc8SOMdme11Nmd9JISH/dA$SlrFeG/4sGukh7o+ywXEWVI1+lWgH96r36BzoIMxI7g', 'active')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Asignación del rol ADMIN al usuario admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;
