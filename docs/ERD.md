# 🗄️ Modelo de Datos y Diagrama Entidad-Relación (ERD) — IntiLink

**Módulo:** Microservicio AUTH  
**Motor de Base de Datos:** PostgreSQL 15  

---

## 1. Diagrama Entidad-Relación (Asociación N:M)

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : "posee (1:N)"
    ROLES ||--o{ USER_ROLES : "asignado a (1:N)"

    USERS {
        uuid id PK "Identificador único (uuid_generate_v4())"
        varchar username UK "Nombre de usuario único (50 car.)"
        varchar email UK "Correo institucional único (100 car.)"
        text password_hash "Hash criptográfico Argon2id"
        varchar status "Estado de cuenta (active / suspended)"
        timestamptz created_at "Fecha y hora de creación"
        timestamptz updated_at "Fecha y hora de última modificación"
    }

    ROLES {
        uuid id PK "Identificador único de rol"
        varchar name UK "Nombre canónico (ADMIN, ANALYST, USER)"
        text description "Descripción de responsabilidades"
        varchar status "Estado (active / inactive)"
        timestamptz created_at "Auditoría de creación"
        timestamptz updated_at "Auditoría de modificación"
    }

    USER_ROLES {
        uuid id PK "Identificador único de la asignación"
        uuid user_id FK "Referencia a USERS(id) ON DELETE CASCADE"
        uuid role_id FK "Referencia a ROLES(id) ON DELETE CASCADE"
        timestamptz assigned_at "Fecha de concesión de privilegios"
    }
```

---

## 2. Restricciones de Integridad y Reglas de Negocio

1. **Relación Muchos a Muchos (N:M):**
   * Un usuario puede acumular múltiples roles (por ejemplo, `ADMIN` y `ANALYST`).
   * Un mismo rol puede estar conferido a múltiples usuarios simultáneamente.
2. **Restricción de Unicidad Compuesta:**
   ```sql
   UNIQUE(user_id, role_id)
   ```
   * Evita duplicidad de asignaciones, previniendo errores de concurrencia y elevación anómala de privilegios (probado en el escenario **T06**, retornando `409 Conflict`).
3. **Índices de Alto Rendimiento:**
   * `idx_user_roles_user_id` e `idx_user_roles_role_id` optimizan las consultas en tiempo real ejecutadas por `/internal/authorization/check`.
4. **Integridad Referencial:**
   * Claves foráneas con eliminación en cascada (`ON DELETE CASCADE`), garantizando consistencia si un usuario o rol es dado de baja.
