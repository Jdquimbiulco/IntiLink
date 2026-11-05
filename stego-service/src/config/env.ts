import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "5000"),
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:4000",
  authCaCertPath: process.env.AUTH_CA_CERT_PATH || "/run/keys/tls.crt",
  authPublicKeyPath: process.env.AUTH_PUBLIC_KEY_PATH || "/run/keys/public.pem",
  serviceToken: process.env.SERVICE_TOKEN || "",
  jwtIssuer: process.env.JWT_ISSUER || "intilink-auth",
  jwtAudience: process.env.JWT_AUDIENCE || "intilink-services",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"),
  uploadDir: process.env.UPLOAD_DIR || "./data/quarantine",
  resultsFile: process.env.RESULTS_FILE || "./data/results.json",
  allowedMimes: (process.env.ALLOWED_MIMES || "image/png,image/bmp").split(","),
  allowedExt: (process.env.ALLOWED_EXT || ".png,.bmp").split(",")
};
