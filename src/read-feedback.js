import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { decryptJson, getEncryptionKey } from "./security.js";

const FEEDBACK_FILE = path.resolve(
  process.env.DATA_DIR || "data",
  "feedback-log.jsonl"
);
const encryptionKey = getEncryptionKey(process.env.ENCRYPTION_KEY);

async function main() {
  const file = await readFile(FEEDBACK_FILE, "utf8");
  const rows = file
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const entries = rows.map((line) => {
    const record = JSON.parse(line);
    return decryptJson(record, encryptionKey);
  });

  console.log(JSON.stringify(entries, null, 2));
}

main().catch((error) => {
  console.error("Failed to read feedback log.", error.message);
  process.exitCode = 1;
});


try {
  const raw = await readFile("data/feedback-log.jsonl", "utf8");
  // ... parse and display
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("No feedback received yet.");
  } else {
    throw err;
  }
}
