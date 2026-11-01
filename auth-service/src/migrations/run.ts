import fs from "fs";
import path from "path";
import { pool } from "../config/db";

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, "001_init.sql"), "utf-8");
    await pool.query(sql);
    console.log("Migrations applied");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
