# IntiLink - Backend V1 (AUTH + STEGO)

## Arquitectura
- **auth-service** (Puerto 4000): Autenticación JWT (RS256), RBAC con modelo N:M (users, roles, user_roles), gestión de usuarios/roles/asignaciones, endpoint interno de autorización.
- **stego-service** (Puerto 5000): Análisis de esteganografía LSB en imágenes PNG/BMP. Valida JWT localmente con clave pública y consulta autorización vigente a AUTH por servicio.

## Requisitos
- Docker y Docker Compose

## Inicio rápido
```bash
docker compose up --build
```

## Migraciones AUTH
```bash
# Dentro del contenedor auth-service
npm run migrate
```

## Endpoints principales
### AUTH
- POST /api/auth/login (público)
- GET /api/auth/profile (autenticado)
- POST /api/auth/logout (autenticado)
- POST/GET /api/users (ADMIN)
- PATCH /api/users/:id (ADMIN)
- POST/GET /api/roles (ADMIN)
- PATCH /api/roles/:id (ADMIN)
- POST /api/user-roles (ADMIN)
- DELETE /api/user-roles/:id (ADMIN)
- POST /internal/authorization/check (solo STEGO con x-service-token)

### STEGO
- POST /api/steganography/analyze (ADMIN o ANALYST - autorizado por AUTH vigente)
- GET /api/steganography/results/:id (propietario con autorización vigente)

## Notas de seguridad
- Contraseñas con Argon2id
- JWT firmado RS256 (clave privada solo en AUTH)
- Autorización consultada en tiempo real desde AUTH (no solo claims del JWT)
- Revocación de roles efectiva en siguiente solicitud
- Comunicación entre servicios con token de servicio
- Validación de tipo/firmas/tamaño de archivo
- Denegación por defecto si AUTH no responde

## Documentación
Ver carpeta `docs/` para diagramas, OpenAPI y matriz de riesgos.
