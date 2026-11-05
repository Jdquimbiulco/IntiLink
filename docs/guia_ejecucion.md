# Guía de Ejecución

## Levantar servicios

```bash
docker compose up --build -d
```

> **Nota:** Las migraciones de base de datos (`users`, `roles`, `user_roles`) y la creación del usuario inicial `admin` se ejecutan **de manera 100% automática** al iniciar el contenedor `auth-service`.

> **Claves y canal interno:** AUTH genera las claves JWT y el certificado TLS en el volumen Docker privado `jwt_keys` durante el arranque. STEGO sólo monta ese volumen en modo lectura, valida el certificado y nunca recibe la clave privada JWT. La autorización interna usa HTTPS en el puerto 4001, no expuesto al host.

## Aplicar migraciones manualmente (Opcional)

Si deseas forzar o reejecutar las migraciones manualmente:

```bash
docker compose exec auth-service npm run migrate
```

## Crear usuario ADMIN de prueba (ejemplo con psql)

```sql
-- Generar hash Argon2 con herramienta o script; ejemplo simplificado
INSERT INTO users (username, email, password_hash, status)
VALUES ('admin', 'admin@test.com', '<argon2_hash>', 'active');
-- Asignar rol ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username='admin' AND r.name='ADMIN';
```

## Pruebas con curl

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"pass"}'

# Analizar imagen
curl -X POST http://localhost:5000/api/steganography/analyze -H "Authorization: Bearer <JWT>" -F "file=@samples/test.png"
```
