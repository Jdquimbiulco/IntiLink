# 🧪 Guía Práctica de Pruebas: Escenarios T01 al T12
**Proyecto Integrador — Primer Parcial | Desarrollo Software Seguro**
**Sistema IntiLink (Backend V1: AUTH + STEGO)**

---

## 📌 Resumen Conceptual Rápido para la Sustentación

El sistema está construido bajo tres principios fundamentales de ciberseguridad:
1. **Zero Trust (Confianza Cero):** STEGO no confía en que un JWT sea suficiente para procesar un archivo; consulta en tiempo real a AUTH si los roles del usuario siguen vigentes en la base de datos.
2. **Secure by Design & Separación de Responsabilidades:** STEGO jamás accede a la base de datos de usuarios ni conoce la clave privada de firma.
3. **Fail-Safe Defaults (Fallo Seguro):** Si AUTH está caído o inaccesible, STEGO rechaza la solicitud de inmediato (HTTP 403) sin procesar el archivo.

---

## 🛠️ Preparación Inicial

Asegúrate de tener los servicios levantados antes de empezar:
```bash
cd /home/juanito/Documents/Materias/SoftwareSeguro/Proyecto/IntiLink
docker compose up -d
```
Verifica que los tres contenedores estén corriendo:
* `auth-db` (PostgreSQL en puerto 5433)
* `auth-service` (API REST en puerto 4000)
* `stego-service` (API REST en puerto 5000)

---

# 🚀 Batería de Pruebas (T01 a T12)

---

### 🔹 T01 — Despliegue e Independencia de Microservicios
* **Objetivo:** Demostrar que AUTH y STEGO son procesos autónomos que pueden iniciarse, detenerse y ejecutarse por separado sin colapsar la infraestructura.
* **Pasos a ejecutar en Terminal:**
  1. Detén únicamente el servicio de esteganografía:
     ```bash
     docker compose stop stego-service
     ```
  2. Verifica que AUTH sigue funcionando normalmente:
     ```bash
     curl -s http://localhost:4000/health
     ```
     *(Responde: `{"status":"ok","service":"auth"}`)*
  3. Vuelve a iniciar STEGO:
     ```bash
     docker compose start stego-service
     ```
* **Evidencia para el informe:** Captura de la terminal mostrando la detención de STEGO mientras AUTH sigue respondiendo con HTTP 200.
* **Defensa oral:** *"Demostramos que no es una arquitectura monolítica; son dos contenedores independientes en Docker Compose con puertos, dependencias y ciclos de vida aislados."*

---

### 🔹 T02 — Autenticación con Contraseña Válida e Inválida
* **Objetivo:** Comprobar el hashing seguro con **Argon2id** y la emisión de tokens **JWT asimétricos (RS256)** con expiración de 15 minutos.

#### Prueba 2.1: Login Inválido (Rechazo)
* **Método:** `POST`
* **URL:** `http://localhost:4000/api/auth/login`
* **Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "PasswordIncorrecto123"
  }
  ```
* **Resultado:** Status **`401 Unauthorized`** con `{"error": "invalid_credentials"}`.

#### Prueba 2.2: Login Exitoso (Emisión de Token)
* **Método:** `POST`
* **URL:** `http://localhost:4000/api/auth/login`
* **Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "Admin123!"
  }
  ```
* **Resultado:** Status **`200 OK`** devolviendo `access_token`, `token_type: "Bearer"` y `expires_in: "15m"`.
* 📋 **Guarda este token** como `ADMIN_TOKEN`.
* **Evidencia para el informe:** Captura de ambas respuestas (401 y 200).

---

### 🔹 T03 — Acceso a STEGO sin Token o con Token Falsificado
* **Objetivo:** Comprobar la barrera criptográfica de STEGO mediante su verificación local con la clave pública (`public.pem`).

#### Prueba 3.1: Petición sin Header Authorization
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/steganography/analyze`
* **Auth:** Ninguna
* **Resultado:** Status **`401 Unauthorized`** (`{"error": "unauthorized"}`).

#### Prueba 3.2: Petición con Token Manipulado / Falso
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/steganography/analyze`
* **Auth:** Bearer `token_falso_manipulado.abc.123`
* **Resultado:** Status **`401 Unauthorized`** (`{"error": "unauthorized"}`).
* **Evidencia para el informe:** Captura de Thunder Client mostrando el error 401 en ambos casos.

---

### 🔹 T04 — Usuario con Rol `USER` intenta Analizar (RBAC)
* **Objetivo:** Comprobar el principio de mínimo privilegio. Un usuario regular no debe tener acceso a herramientas de análisis esteganográfico.
* **Pasos:**
  1. Haz login con el usuario regular `user1` (`POST http://localhost:4000/api/auth/login` con `{"username":"user1", "password":"User123!"}`).
  2. Copia el token devuelto (`USER_TOKEN`).
  3. En Thunder Client, envía un análisis a STEGO:
     * **Método:** `POST`
     * **URL:** `http://localhost:5000/api/steganography/analyze`
     * **Auth:** Bearer `USER_TOKEN`
     * **Body:** Form-data con campo `file` seleccionando `imagen_limpia.png`.
* **Resultado:** Status **`403 Forbidden`** con:
  ```json
  {
    "error": "forbidden",
    "reason": "insufficient_role"
  }
  ```
* **Evidencia para el informe:** Captura mostrando que STEGO deniega el acceso a usuarios sin rol ANALYST o ADMIN.

---

### 🔹 T05 — Relación Muchos a Muchos (N:M) entre Usuarios y Roles
* **Objetivo:** Demostrar que el modelo relacional implementa una asociación N:M real mediante la tabla asociativa `user_roles`.
* **Pasos:**
  1. Como ADMIN, consulta los roles y usuarios disponibles:
     * `GET http://localhost:4000/api/roles` (Auth: Bearer `ADMIN_TOKEN`)
     * `GET http://localhost:4000/api/users` (Auth: Bearer `ADMIN_TOKEN`)
  2. Asigna un rol a un usuario:
     * **Método:** `POST`
     * **URL:** `http://localhost:4000/api/user-roles`
     * **Auth:** Bearer `ADMIN_TOKEN`
     * **Body (JSON):**
       ```json
       {
         "user_id": "<UUID_DE_ANALYST1>",
         "role_id": "1ac196fa-920c-47f5-9214-7ed82a6eaaac"
       }
       ```
     * **Resultado:** Status **`201 Created`** con el ID de la asignación generada.
  3. Consulta todas las asignaciones activas:
     * **Método:** `GET`
     * **URL:** `http://localhost:4000/api/user-roles`
     * **Auth:** Bearer `ADMIN_TOKEN`
     * **Resultado:** Status **`200 OK`** mostrando usuarios con múltiples roles y roles compartidos por varios usuarios.
* **Evidencia para el informe:** Captura del `GET /api/user-roles` donde se aprecie la relación N:M.

---

### 🔹 T06 — Prevención de Asignaciones Duplicadas (Integridad Referencial)
* **Objetivo:** Comprobar la restricción `UNIQUE(user_id, role_id)` en la base de datos para evitar duplicación de privilegios.
* **Pasos:**
  1. En Thunder Client, repite exactamente la misma petición del paso anterior (T05.2) con el mismo `user_id` y `role_id`.
* **Resultado:** Status **`409 Conflict`** con:
  ```json
  {
    "error": "duplicate_assignment"
  }
  ```
* **Evidencia para el informe:** Captura de Thunder Client mostrando el código HTTP 409 Conflict.

---

### 🔹 T07 — Revocación Inmediata de Rol con JWT Vigente (Zero Trust)
* **Objetivo:** Demostrar que revocar un rol en la base de datos inhabilita inmediatamente las operaciones en STEGO, **incluso si el JWT aún no ha expirado**.
* **Pasos:**
  1. **Línea base:** Realiza un análisis exitoso en STEGO con el token de `analyst1` (`POST /api/steganography/analyze`). Verifica que responde **`200 OK`**.
  2. **Obtener el ID de asignación:** Haz `GET http://localhost:4000/api/user-roles` con el token de admin y copia el `id` de la asignación del rol ANALYST de `analyst1`.
  3. **Revocar el rol:**
     * **Método:** `DELETE`
     * **URL:** `http://localhost:4000/api/user-roles/<ID_DE_ASIGNACION>`
     * **Auth:** Bearer `ADMIN_TOKEN`
     * **Resultado:** Status **`200 OK`** (`{"removed": true}`).
  4. **Prueba de fuego (Reusar el mismo token):**
     * Vuelve a la petición de análisis de STEGO usando el **mismo token** de `analyst1` (sin volver a iniciar sesión).
     * Presiona **Send**.
* **Resultado:** Status **`403 Forbidden`** con `{"error": "forbidden", "reason": "insufficient_role"}`.
* **Evidencia para el informe:** Las 3 capturas consecutivas: Análisis exitoso (200) ➔ Eliminación de rol (200) ➔ Rechazo inmediato con el mismo token (403).

---

### 🔹 T08 — Fallo Seguro ante Caída de AUTH (Fail-Safe Defaults)
* **Objetivo:** Comprobar que ante la pérdida de comunicación con AUTH, STEGO deniega por defecto cualquier procesamiento de archivos.
* **Pasos:**
  1. En tu terminal de Linux, pausa el contenedor de AUTH:
     ```bash
     docker compose pause auth-service
     ```
  2. En Thunder Client, intenta enviar un análisis a STEGO con un token válido.
* **Resultado:** Status **`403 Forbidden`** con:
  ```json
  {
    "error": "forbidden",
    "reason": "auth_unavailable"
  }
  ```
  *(STEGO no procesó la imagen porque no pudo confirmar la autorización).*
* **Restauración:**
  ```bash
  docker compose unpause auth-service
  ```
* **Evidencia para el informe:** Captura de la respuesta HTTP 403 con razón `auth_unavailable`.

---

### 🔹 T09 — Análisis LSB: Muestra Limpia vs. Muestra Sospechosa
* **Objetivo:** Validar el procesamiento real de imágenes PNG/BMP y la aplicación de políticas de seguridad según los indicadores estadísticos calculados.

#### Prueba 9.1: Imagen Limpia (`imagen_limpia.png`)
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/steganography/analyze`
* **Auth:** Bearer `ANALYST_TOKEN`
* **Body:** Form-data con campo `file` seleccionando `imagen_limpia.png`.
* **Resultado:** Status **`200 OK`** con:
  * `status`: `"sin_indicios"`
  * `anomaly_score`: < 0.10
  * `action`: `"ninguna"`

#### Prueba 9.2: Imagen con Carga LSB (`imagen_con_lsb.png`)
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/steganography/analyze`
* **Auth:** Bearer `ANALYST_TOKEN`
* **Body:** Form-data con campo `file` seleccionando `imagen_con_lsb.png`.
* **Resultado:** Status **`200 OK`** con:
  * `status`: `"sospechoso"`
  * `anomaly_score`: 1.0 (supera el umbral 0.75)
  * `action`: `"cuarentena"`
* 📋 **Copia el `analysis_id`** para la prueba T11.
* **Evidencia para el informe:** Captura de los dos JSONs comparando los indicadores estadísticos.

---

### 🔹 T10 — Carga de Archivo Inválido o Formato No Soportado
* **Objetivo:** Verificar la mitigación de cargas maliciosas mediante validación estricta de Magic Bytes (firmas reales de archivo) y tipos MIME.
* **Pasos:**
  1. Intenta subir un archivo que no sea imagen (por ejemplo, un `.txt` o `.pdf`) al endpoint de análisis:
     * **Método:** `POST`
     * **URL:** `http://localhost:5000/api/steganography/analyze`
     * **Auth:** Bearer `ANALYST_TOKEN`
     * **Body:** Form-data con campo `file` seleccionando cualquier archivo de texto.
* **Resultado:** Status **`415 Unsupported Media Type`** (`{"error": "unsupported_format"}`).
* **Evidencia para el informe:** Captura mostrando el rechazo con código HTTP 415.

---

### 🔹 T11 — Control de Acceso por Propietario al Recurso de Análisis (IDOR)
* **Objetivo:** Demostrar que un usuario no puede espiar ni acceder a los resultados de análisis generados por otro usuario.
* **Pasos:**
  1. Usa el `analysis_id` obtenido en la prueba T09.2 (generado por `analyst1`).
  2. Intenta consultarlo usando el token del usuario `user1`:
     * **Método:** `GET`
     * **URL:** `http://localhost:5000/api/steganography/results/<analysis_id>`
     * **Auth:** Bearer `USER_TOKEN`
* **Resultado:** Status **`403 Forbidden`** (`{"error": "forbidden"}`).
* **Evidencia para el informe:** Captura de Thunder Client mostrando el bloqueo de acceso al recurso ajeno.

---

### 🔹 T12 — Bitácoras Seguras de Auditoría y Trazabilidad (DLP)
* **Objetivo:** Demostrar trazabilidad completa de eventos relevantes sin fuga de información sensible (no se imprimen contraseñas, claves privadas ni JWTs completos).
* **Pasos a ejecutar en Terminal:**
  1. Consulta los registros de auditoría de AUTH:
     ```bash
     docker compose logs auth-service --tail=25
     ```
  2. Consulta los registros de auditoría de STEGO:
     ```bash
     docker compose logs stego-service --tail=25
     ```
* **Elementos visibles en los registros:**
  * Prefijo claro: `[AUDIT]`
  * Eventos de negocio: `[LOGIN_SUCCESS]`, `[AUTHZ_DECISION]`, `[STEGO_ANALYSIS_SUCCESS]`
  * Hash SHA-256 del archivo procesado y política aplicada (`cuarentena`)
  * **Enmascaramiento de tokens:** Los JWT se muestran recortados como `Bearer eyJhbGci...VzH6DBrQ`
  * **Ausencia de secretos:** Ninguna contraseña ni clave privada aparece en los logs.
* **Evidencia para el informe:** Captura de pantalla de la terminal con las líneas de logs de ambos servicios.

---

## 📊 Matriz de Resumen para la Sustentación

| ID | Escenario | Método / Ruta | Código HTTP | Concepto Demostrado |
|:---:|---|---|:---:|---|
| **T01** | Autonomía de servicios | `GET /health` | 200 OK | Desacoplamiento arquitectónico |
| **T02** | Autenticación | `POST /api/auth/login` | 200 / 401 | Argon2id + JWT RS256 |
| **T03** | Sin token / token falso | `POST /api/steganography/analyze` | 401 Unauthorized | Verificación criptográfica con clave pública |
| **T04** | Acceso rol USER | `POST /api/steganography/analyze` | 403 Forbidden | Mínimo privilegio / RBAC |
| **T05** | Relación N:M | `GET /api/user-roles` | 200 OK | Modelo relacional users-roles normalizado |
| **T06** | Asignación duplicada | `POST /api/user-roles` | 409 Conflict | Integridad referencial `UNIQUE(user_id, role_id)` |
| **T07** | Revocación en vivo | `POST /api/steganography/analyze` | 403 Forbidden | Zero Trust / Validación activa en DB |
| **T08** | AUTH caído | `POST /api/steganography/analyze` | 403 Forbidden | Fallo seguro (Fail-Safe Defaults) |
| **T09** | Análisis LSB | `POST /api/steganography/analyze` | 200 OK | Detección estadística y cuarentena |
| **T10** | Archivo no soportado | `POST /api/steganography/analyze` | 415 / 400 | Validación de magic bytes y sanitización |
| **T11** | Recurso ajeno | `GET /api/steganography/results/:id` | 403 Forbidden | Prevención de IDOR / Propiedad del recurso |
| **T12** | Bitácoras de auditoría | `docker compose logs` | N/A | Trazabilidad y Data Loss Prevention (DLP) |

