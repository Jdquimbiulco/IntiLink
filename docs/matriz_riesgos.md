# Matriz de Riesgos

| Activo | Amenaza | Vulnerabilidad | Riesgo | Control | Estado |
|---|---|---|---|---|---|
| Credenciales | Suplantación | Contraseñas débiles/almacenamiento | Alto | Argon2id, rate-limit login | Aplicado |
| JWT | Falsificación | Algoritmo débil/clave expuesta | Alto | RS256, clave privada en AUTH, verificación con pubkey | Aplicado |
| RBAC | Elevación privilegios | Confianza en claims JWT | Alto | Autorización vigente en AUTH por cada operación | Aplicado |
| Comunicación AUTH-STEGO | Spoofing servicio | Sin autenticación mutua | Alto | x-service-token, timeout, denegación por defecto | Aplicado |
| Archivos | Upload malicioso | Sin validación | Alto | Magic numbers, MIME/ext, tamaño, memoryStorage | Aplicado |
| Revocación roles | Sesión prolongada | JWT no revocable | Alto | Consulta roles activos en AUTH al autorizar | Aplicado |
