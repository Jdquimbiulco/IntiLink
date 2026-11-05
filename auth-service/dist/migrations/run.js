"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
async function run() {
    try {
        const sql = fs_1.default.readFileSync(path_1.default.join(__dirname, "001_init.sql"), "utf-8");
        await db_1.pool.query(sql);
        console.log("Migrations applied");
        process.exit(0);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
