"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stegoService = exports.StegoService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const pngjs_1 = require("pngjs");
const env_1 = require("../config/env");
const uuid_1 = require("uuid");
function readResults() {
    try {
        if (!fs_1.default.existsSync(env_1.env.resultsFile))
            return [];
        const data = JSON.parse(fs_1.default.readFileSync(env_1.env.resultsFile, "utf8"));
        return Array.isArray(data) ? data : [];
    }
    catch (error) {
        console.error("[AUDIT] Unable to read persisted analysis results", error);
        throw new Error("results_unavailable");
    }
}
function persistResults(results) {
    fs_1.default.mkdirSync(path_1.default.dirname(env_1.env.resultsFile), { recursive: true });
    const temporary = `${env_1.env.resultsFile}.tmp`;
    fs_1.default.writeFileSync(temporary, JSON.stringify(results, null, 2), { mode: 0o600 });
    fs_1.default.renameSync(temporary, env_1.env.resultsFile);
}
function decodeBmp(buffer) {
    if (buffer.length < 54 || buffer.readUInt16LE(0) !== 0x4d42)
        throw new Error("invalid_file");
    const pixelOffset = buffer.readUInt32LE(10);
    const width = buffer.readInt32LE(18);
    const rawHeight = buffer.readInt32LE(22);
    const bitsPerPixel = buffer.readUInt16LE(28);
    const compression = buffer.readUInt32LE(30);
    if (width <= 0 || rawHeight === 0 || (bitsPerPixel !== 24 && bitsPerPixel !== 32) || compression !== 0) {
        throw new Error("invalid_file");
    }
    const height = Math.abs(rawHeight);
    const bytesPerPixel = bitsPerPixel / 8;
    const rowSize = Math.ceil((width * bytesPerPixel) / 4) * 4;
    if (pixelOffset + rowSize * height > buffer.length)
        throw new Error("invalid_file");
    const pixels = [];
    for (let row = 0; row < height; row += 1) {
        const sourceRow = rawHeight > 0 ? height - 1 - row : row;
        const rowStart = pixelOffset + sourceRow * rowSize;
        for (let column = 0; column < width; column += 1) {
            const offset = rowStart + column * bytesPerPixel;
            pixels.push({ b: buffer[offset], g: buffer[offset + 1], r: buffer[offset + 2] });
        }
    }
    return pixels;
}
function decodePixels(file) {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ext === ".png") {
        try {
            const image = pngjs_1.PNG.sync.read(file.buffer);
            const pixels = [];
            for (let i = 0; i < image.data.length; i += 4) {
                pixels.push({ r: image.data[i], g: image.data[i + 1], b: image.data[i + 2] });
            }
            return pixels;
        }
        catch (error) {
            console.error("[AUDIT] PNG decoding failed", error);
            throw new Error("invalid_file");
        }
    }
    return decodeBmp(file.buffer);
}
class StegoService {
    validateFile(file) {
        if (!file)
            throw new Error("no_file");
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!env_1.env.allowedExt.includes(ext) || !env_1.env.allowedMimes.includes(file.mimetype)) {
            throw new Error("unsupported_format");
        }
        if (file.size > env_1.env.maxFileSize)
            throw new Error("file_too_large");
        const signature = ext === ".png"
            ? file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
            : file.buffer.subarray(0, 2).equals(Buffer.from([0x42, 0x4d]));
        if (!signature)
            throw new Error("invalid_file");
        decodePixels(file);
    }
    analyzeLSB(file, userId) {
        this.validateFile(file);
        const pixels = decodePixels(file);
        const sha256 = crypto_1.default.createHash("sha256").update(file.buffer).digest("hex");
        const bits = pixels.flatMap((pixel) => [pixel.r & 1, pixel.g & 1, pixel.b & 1]);
        if (bits.length === 0)
            throw new Error("invalid_file");
        const ones = bits.reduce((total, bit) => total + bit, 0);
        const ratio = ones / bits.length;
        const deviation = Math.abs(ratio - 0.5);
        const anomalyScore = Math.min(1, deviation * 10);
        const status = anomalyScore >= 0.75 ? "sospechoso" : "sin_indicios";
        const action = anomalyScore >= 0.75 ? "cuarentena" : anomalyScore >= 0.4 ? "advertencia" : "ninguna";
        const result = {
            analysis_id: (0, uuid_1.v4)(),
            user_id: userId,
            filename: path_1.default.basename(file.originalname),
            sha256,
            technique: "lsb_statistical_analysis",
            status,
            indicators: {
                anomaly_score: Number(anomalyScore.toFixed(3)),
                ratio: Number(ratio.toFixed(3)),
                threshold: 0.75
            },
            action,
            limitations: "Resultado indicativo, no concluyente; la heurística no prueba por sí sola la existencia de esteganografía.",
            created_at: new Date().toISOString()
        };
        if (action === "cuarentena") {
            fs_1.default.mkdirSync(env_1.env.uploadDir, { recursive: true });
            const quarantinedPath = path_1.default.join(env_1.env.uploadDir, `${result.analysis_id}${path_1.default.extname(file.originalname).toLowerCase()}`);
            fs_1.default.writeFileSync(quarantinedPath, file.buffer, { mode: 0o600 });
            result.quarantined_file = path_1.default.basename(quarantinedPath);
        }
        const results = readResults();
        results.push(result);
        persistResults(results);
        return result;
    }
    getResult(id, userId) {
        const result = readResults().find((item) => item.analysis_id === id);
        if (!result)
            throw new Error("not_found");
        if (result.user_id !== userId)
            throw new Error("forbidden");
        return result;
    }
}
exports.StegoService = StegoService;
exports.stegoService = new StegoService();
