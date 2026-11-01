import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "5000"),
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:4000",
  authPublicKeyPath: process.env.AUTH_PUBLIC_KEY_PATH || "./keys/public.pem",
  serviceToken: process.env.SERVICE_TOKEN || "change_me_service_token",
  jwtIssuer: process.env.JWT_ISSUER || "intilink-auth",
  jwtAudience: process.env.JWT_AUDIENCE || "intilink-services",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"),
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  allowedMimes: (process.env.ALLOWED_MIMES || "image/png,image/bmp").split(","),
  allowedExt: (process.env.ALLOWED_EXT || ".png,.bmp").split(",")
};
