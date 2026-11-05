# IntiLink Backend V1

Guía de instalación, demostración y evidencias para el Proyecto Integrador
del primer parcial de Desarrollo Software Seguro.

## 1. Qué se debe demostrar

| Criterio                      | Puntos | Evidencia principal                                             |
| ----------------------------- | -----: | --------------------------------------------------------------- |
| Arquitectura AUTH + STEGO     |    3,0 | Contenedores independientes, `/health`, Compose y OpenAPI     |
| Modelo de identidad           |    3,0 | `users`, `roles`, `user_roles`, N:M, FK y `UNIQUE`      |
| Autenticación JWT            |    3,0 | Login válido/inválido, Argon2id, RS256, `sub`, expiración  |
| RBAC e integración           |    4,0 | 401/403, consulta vigente, revocación y AUTH no disponible     |
| Detección de esteganografía |    5,0 | PNG/BMP real, LSB, hash, clasificación, política y auditoría |
| Pruebas y documentación      |    2,0 | T01–T12, OpenAPI, Postman, riesgos, muestras y logs            |

La demostración debe ejecutarse con los servicios activos. No se deben mostrar
contraseñas reales, claves privadas ni JWT completos en capturas o informes.

## 2. Requisitos

- Docker 20.10 o superior.
- Docker Compose v2.
- PowerShell, curl o un cliente REST como Postman/Thunder Client.
- Python 3, sólo si se desean regenerar las muestras.

## 3. Arranque limpio

Desde PowerShell:

```powershell
Set-Location C:\Users\LENOVO\Documents\Seguridad\IntiLink
Copy-Item auth-service\.env.example auth-service\.env -Force
Copy-Item stego-service\.env.example stego-service\.env -Force
docker compose up --build -d
docker compose ps
```

Debe aparecer `auth-db`, `auth-service` y `stego-service` en estado `Up`.
AUTH crea automáticamente las tablas, roles base y usuario administrador.

Verificar las dos APIs:

```powershell
curl.exe -i http://localhost:4000/health
curl.exe -i http://localhost:5000/health
```

Respuestas esperadas:

```json
{"status":"ok","service":"auth"}
{"status":"ok","service":"stego"}
```

AUTH expone la API pública en `4000`. La autorización interna se realiza por
HTTPS en `4001`, sin publicarse al host. STEGO usa únicamente la clave pública.
El volumen `jwt_keys` se crea en el arranque y contiene las claves generadas
para esa ejecución.

## 4. Muestras de esteganografía

Las muestras incluidas son:

- `imagen_limpia.png` y `muestra_limpia.bmp`: distribución LSB normal.
- `imagen_con_lsb.png` y `muestra_con_lsb.bmp`: distribución LSB anómala.

Para regenerarlas:

```powershell
python generar_imagenes.py
```

El detector decodifica PNG/BMP, valida Magic Bytes, MIME, tamaño y píxeles.
Calcula:

```text
anomaly_score = min(1, abs(ratio_lsb - 0.50) * 10)
```

Resultados:

- `score < 0.75`: `sin_indicios`.
- `score >= 0.75`: `sospechoso`, acción `cuarentena`.
- El resultado incluye UUID, usuario, SHA-256, técnica, indicadores, fecha,
  política y limitaciones.

## 5. Datos de demostración

El usuario inicial se crea en la migración:

```text
usuario: admin
contraseña: Admin123!
rol: ADMIN
```

Para la demostración, se recomienda crear dos usuarios desde la API:

- `analyst1`: tendrá `ANALYST`.
- `user1`: tendrá `USER`.

No reutilice la contraseña del administrador en otros usuarios.

## 6. Demostración paso a paso

### T01 — Arquitectura e independencia

```powershell
docker compose stop stego-service
curl.exe -i http://localhost:4000/health
docker compose start stego-service
curl.exe -i http://localhost:5000/health
```

Evidencia: AUTH sigue respondiendo mientras STEGO está detenido y luego ambos
vuelven a responder. Mostrar también:

```powershell
docker compose ps
```

### T02 — Login, hashing y JWT

Login inválido:

```powershell
curl.exe -i -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"incorrecta"}'
```

Esperado: `401`.

Login válido:

```powershell
$login = curl.exe -sS -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin123!"}'
$login
$adminToken = ($login | ConvertFrom-Json).access_token
```

Esperado: `200`, `token_type: Bearer`, `expires_in: 15m` y un JWT RS256.
No se debe imprimir ni guardar el JWT en el informe.

Comprobar el perfil:

```powershell
curl.exe -i http://localhost:4000/api/auth/profile `
  -H "Authorization: Bearer $adminToken"
```

### T03 — 401 en STEGO

Sin token:

```powershell
curl.exe -i -X POST http://localhost:5000/api/steganography/analyze
```

Token manipulado:

```powershell
curl.exe -i -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer token.invalido"
```

Ambos deben responder `401` y no procesar archivos.

### T04 — Crear usuarios y probar RBAC

Crear `analyst1` y `user1` como ADMIN:

```powershell
$analyst = curl.exe -sS -X POST http://localhost:4000/api/users `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"username":"analyst1","email":"analyst1@demo.local","password":"Analyst123!"}' | ConvertFrom-Json

$user = curl.exe -sS -X POST http://localhost:4000/api/users `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"username":"user1","email":"user1@demo.local","password":"User123!"}' | ConvertFrom-Json

$users = curl.exe -sS http://localhost:4000/api/users `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json
$roles = curl.exe -sS http://localhost:4000/api/roles `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json

$analystId = ($users | Where-Object username -eq "analyst1").id
$userId = ($users | Where-Object username -eq "user1").id
$analystRoleId = ($roles | Where-Object name -eq "ANALYST").id
$userRoleId = ($roles | Where-Object name -eq "USER").id
```

Asignar roles:

```powershell
curl.exe -i -X POST http://localhost:4000/api/user-roles `
  -H "Authorization: Bearer $adminToken" -H "Content-Type: application/json" `
  -d "{`"user_id`":`"$analystId`",`"role_id`":`"$analystRoleId`"}"

curl.exe -i -X POST http://localhost:4000/api/user-roles `
  -H "Authorization: Bearer $adminToken" -H "Content-Type: application/json" `
  -d "{`"user_id`":`"$userId`",`"role_id`":`"$userRoleId`"}"
```

Esto demuestra usuarios, roles, asignaciones N:M, claves foráneas y unicidad.
La misma pareja `user_id`/`role_id` repetida debe devolver `409`.

Login de ambos usuarios:

```powershell
$analystLogin = curl.exe -sS -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"analyst1","password":"Analyst123!"}' | ConvertFrom-Json
$analystToken = $analystLogin.access_token

$userLogin = curl.exe -sS -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"user1","password":"User123!"}' | ConvertFrom-Json
$userToken = $userLogin.access_token
```

Un análisis como USER debe devolver `403`:

```powershell
curl.exe -i -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer $userToken" `
  -F "file=@imagen_limpia.png"
```

### T05 — Análisis autorizado y LSB

Como `analyst1`:

```powershell
$analysis = curl.exe -sS -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer $analystToken" `
  -F "file=@imagen_limpia.png" | ConvertFrom-Json
$analysis
$analysisId = $analysis.analysis_id
```

Esperado: `200`, `status: sin_indicios`, `action: ninguna`.

Repetir con la muestra oculta:

```powershell
curl.exe -sS -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer $analystToken" `
  -F "file=@imagen_con_lsb.png"
```

Esperado: `200`, `status: sospechoso`, `action: cuarentena`, `sha256` e
`indicators.anomaly_score >= 0.75`.

Consultar el resultado:

```powershell
curl.exe -i http://localhost:5000/api/steganography/results/$analysisId `
  -H "Authorization: Bearer $analystToken"
```

Los metadatos persisten en el volumen `stego_data`; los archivos sospechosos
no se sirven como archivos públicos.

### T06 — Revocación inmediata

Obtener asignaciones:

```powershell
$assignments = curl.exe -sS http://localhost:4000/api/user-roles `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json
$assignmentId = ($assignments | Where-Object {
  $_.user_id -eq $analystId -and $_.role_name -eq "ANALYST"
}).id
```

Revocar:

```powershell
curl.exe -i -X DELETE http://localhost:4000/api/user-roles/$assignmentId `
  -H "Authorization: Bearer $adminToken"
```

Reutilizar el mismo `$analystToken`:

```powershell
curl.exe -i -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer $analystToken" `
  -F "file=@imagen_limpia.png"
```

Esperado: `403 insufficient_role`, aunque el JWT todavía no haya expirado.

### T07 — Fallo seguro cuando AUTH no está disponible

```powershell
docker compose stop auth-service
curl.exe -i -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer $analystToken" `
  -F "file=@imagen_limpia.png"
docker compose start auth-service
```

Esperado: `403` con razón `auth_unavailable`. STEGO no debe calcular ni
persistir el análisis cuando AUTH no responde.

### T08 — Validación de archivos

Archivo no admitido:

```powershell
"texto" | Set-Content invalid.txt
curl.exe -i -X POST http://localhost:5000/api/steganography/analyze `
  -H "Authorization: Bearer $adminToken" -F "file=@invalid.txt"
```

Esperado: `415` o `400`. Un archivo mayor que 5 MB debe devolver `413`.
Un archivo renombrado como PNG pero con firma inválida debe ser rechazado.

### T09 — Propiedad del resultado

Consultar `$analysisId` usando `$userToken`:

```powershell
curl.exe -i http://localhost:5000/api/steganography/results/$analysisId `
  -H "Authorization: Bearer $userToken"
```

Esperado: `403`. El control se hace por `user_id` del resultado y no sólo por
el identificador.

### T10 — Bitácoras y auditoría

```powershell
docker compose logs --tail=50 auth-service
docker compose logs --tail=50 stego-service
```

Mostrar eventos `[AUDIT]`, decisiones de autorización, hash SHA-256 y política
aplicada. Los JWT aparecen enmascarados y no se muestran contraseñas ni claves.

## 7. Evidencias que se deben guardar

Guardar capturas o salidas de terminal, identificadas así:

1. `E01-arquitectura`: `docker compose ps`, ambos `/health` y T01.
2. `E02-identidad`: creación de usuarios, roles, `GET /api/user-roles` y `409`.
3. `E03-jwt`: login `200`, login `401`, perfil y token no expuesto.
4. `E04-rbac`: USER `403`, revocación con el mismo JWT y AUTH detenido.
5. `E05-stego`: imagen limpia, imagen LSB, hash, indicadores y consulta de resultado.
6. `E06-documentacion`: OpenAPI, Postman/Thunder Client, matriz de riesgos y logs.

## 8. Documentación y contratos

- [Arquitectura y límites de confianza](docs/arquitectura.md)
- [Modelo ERD y relación N:M](docs/ERD.md)
- [Guía completa T01–T12](docs/guia_pruebas_T01_T12.md)
- [Matriz de riesgos](docs/matriz_riesgos.md)
- [OpenAPI AUTH](docs/openapi-auth.yaml)
- [OpenAPI STEGO](docs/openapi-stego.yaml)
- [Guía de ejecución](docs/guia_ejecucion.md)
- [Colección Postman](postman/IntiLink.postman_collection.json)
- [Colección Thunder Client](postman/thunder-collection_IntiLink.json)

## 9. Validación técnica antes de entregar

```powershell
Set-Location auth-service
npm install
npm run build
npm audit --omit=dev

Set-Location ..\stego-service
npm install
npm run build
npm audit --omit=dev

Set-Location ..
docker compose config --quiet
docker compose down
```

Cada `build` debe terminar correctamente y cada auditoría debe indicar
`found 0 vulnerabilities`.

## 10. Cierre

Al finalizar la sustentación:

```powershell
docker compose down
```

No eliminar `auth_db_data`, `jwt_keys` ni `stego_data` antes de mostrar la
persistencia, salvo que se quiera reiniciar completamente la demostración.
