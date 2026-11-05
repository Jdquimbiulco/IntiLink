import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "4000"),
  internalPort: parseInt(process.env.INTERNAL_PORT || "4001"),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtPrivateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || "/run/keys/private.pem",
  jwtPublicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || "/run/keys/public.pem",
  jwtIssuer: process.env.JWT_ISSUER || "intilink-auth",
  jwtAudience: process.env.JWT_AUDIENCE || "intilink-services",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  serviceToken: process.env.SERVICE_TOKEN || "",
  tlsKeyPath: process.env.TLS_KEY_PATH || "/run/keys/tls.key",
  tlsCertPath: process.env.TLS_CERT_PATH || "/run/keys/tls.crt"
};
