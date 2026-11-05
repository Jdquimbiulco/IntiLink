import axios from "axios";
import https from "https";
import fs from "fs";
import { env } from "../config/env";

export async function checkAuthorization(subject_token: string, action: string) {
  try {
    const res = await axios.post(
      `${env.authServiceUrl}/internal/authorization/check`,
      { subject_token, action },
      {
        headers: { "x-service-token": env.serviceToken },
        timeout: 3000,
        httpsAgent: env.authServiceUrl.startsWith("https://")
          ? new https.Agent({ ca: fs.readFileSync(env.authCaCertPath), rejectUnauthorized: true })
          : undefined
      }
    );
    return res.data;
  } catch (e: any) {
    if (e.response?.data) return e.response.data;
    return { allowed: false, reason: "auth_unavailable" };
  }
}
