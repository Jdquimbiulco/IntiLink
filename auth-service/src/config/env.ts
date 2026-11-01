import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "4000"),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtPrivateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || "./keys/private.pem",
  jwtPublicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || "./keys/public.pem",
  jwtIssuer: process.env.JWT_ISSUER || "intilink-auth",
  jwtAudience: process.env.JWT_AUDIENCE || "intilink-services",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  serviceToken: process.env.SERVICE_TOKEN || "change_me_service_token"
};
