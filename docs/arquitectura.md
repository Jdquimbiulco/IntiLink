# Arquitectura

## Diagrama
```
Cliente REST --> AUTH (4000) [JWT RS256, RBAC, N:M users/roles/user_roles]
              --> STEGO (5000) [Valida JWT con pubkey, consulta /internal/authorization/check a AUTH con x-service-token]
```

## Límites de confianza
- AUTH es autoridad única de identidades/roles
- STEGO nunca accede a DB de AUTH
- Clave privada solo en AUTH
- Comunicación entre servicios autenticada por token
- Denegación por defecto

## RBAC
- ADMIN: gestión completa
- ANALYST: puede analizar
- USER: perfil
- Revocación efectiva (consulta vigente)
