import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { v4 as uuidv4 } from "uuid";

export interface AnalysisResult {
  analysis_id: string;
  user_id: string;
  filename: string;
  sha256: string;
  technique: string;
  status: "sin_indicios" | "sospechoso" | "no_concluyentes" | "error";
  indicators: any;
  action: "rechazo" | "cuarentena" | "advertencia" | "ninguna";
  limitations: string;
  created_at: string;
}

const results: AnalysisResult[] = [];

export class StegoService {
  validateFile(file: Express.Multer.File) {
    if (!file) throw new Error("no_file");
    const ext = path.extname(file.originalname).toLowerCase();
    if (!env.allowedExt.includes(ext)) throw new Error("unsupported_format");
    if (!env.allowedMimes.includes(file.mimetype)) throw new Error("unsupported_format");
    if (file.size > env.maxFileSize) throw new Error("file_too_large");
    // Basic magic number check for PNG and BMP
    const buf = file.buffer;
    if (ext === ".png") {
      // PNG signature
      if (!(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47)) throw new Error("invalid_file");
    }
    if (ext === ".bmp") {
      if (!(buf[0] === 0x42 && buf[1] === 0x4D)) throw new Error("invalid_file");
    }
  }

  analyzeLSB(file: Express.Multer.File, userId: string): AnalysisResult {
    this.validateFile(file);
    const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");
    // Simple LSB statistical analysis (chi-square-like heuristic)
    const pixels = [];
    // For simplicity, scan bytes after headers
    for (let i = 54; i < Math.min(file.buffer.length, 10000); i++) {
      pixels.push(file.buffer[i] & 1);
    }
    if (pixels.length === 0) {
      return {
        analysis_id: uuidv4(),
        user_id: userId,
        filename: file.originalname,
        sha256,
        technique: "lsb_statistical_analysis",
        status: "no_concluyentes",
        indicators: { reason: "insufficient_data" },
        action: "cuarentena",
        limitations: "Resultado indicativo, no concluyente",
        created_at: new Date().toISOString()
      };
    }
    const ones = pixels.filter((b) => b === 1).length;
    const ratio = ones / pixels.length;
    // Expect ~0.5 for natural images; deviation suggests possible embedding
    const deviation = Math.abs(ratio - 0.5);
    const anomaly_score = Math.min(1, deviation * 10);
    if (anomaly_score >= 0.75) {
      const result: AnalysisResult = {
        analysis_id: uuidv4(),
        user_id: userId,
        filename: file.originalname,
        sha256,
        technique: "lsb_statistical_analysis",
        status: "sospechoso",
        indicators: { anomaly_score: Number(anomaly_score.toFixed(3)), ratio: Number(ratio.toFixed(3)), threshold: 0.75 },
        action: "cuarentena",
        limitations: "Resultado indicativo, no concluyente",
        created_at: new Date().toISOString()
      };
      results.push(result);
      return result;
    } else if (anomaly_score >= 0.4) {
      const result: AnalysisResult = {
        analysis_id: uuidv4(),
        user_id: userId,
        filename: file.originalname,
        sha256,
        technique: "lsb_statistical_analysis",
        status: "sin_indicios",
        indicators: { anomaly_score: Number(anomaly_score.toFixed(3)), ratio: Number(ratio.toFixed(3)), threshold: 0.75 },
        action: "advertencia",
        limitations: "Resultado indicativo, no concluyente",
        created_at: new Date().toISOString()
      };
      results.push(result);
      return result;
    } else {
      const result: AnalysisResult = {
        analysis_id: uuidv4(),
        user_id: userId,
        filename: file.originalname,
        sha256,
        technique: "lsb_statistical_analysis",
        status: "sin_indicios",
        indicators: { anomaly_score: Number(anomaly_score.toFixed(3)), ratio: Number(ratio.toFixed(3)), threshold: 0.75 },
        action: "ninguna",
        limitations: "Resultado indicativo, no concluyente",
        created_at: new Date().toISOString()
      };
      results.push(result);
      return result;
    }
  }

  getResult(id: string, userId: string) {
    const result = results.find((r) => r.analysis_id === id);
    if (!result) throw new Error("not_found");
    if (result.user_id !== userId) throw new Error("forbidden");
    return result;
  }
}

export const stegoService = new StegoService();
export { results };
