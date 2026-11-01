import axios from "axios";
import { env } from "../config/env";

export async function checkAuthorization(subject_token: string, action: string) {
  try {
    const res = await axios.post(
      `${env.authServiceUrl}/internal/authorization/check`,
      { subject_token, action },
      { headers: { "x-service-token": env.serviceToken }, timeout: 3000 }
    );
    return res.data;
  } catch (e: any) {
    if (e.response?.data) return e.response.data;
    return { allowed: false, reason: "auth_unavailable" };
  }
}
