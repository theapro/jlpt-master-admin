import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${filePath}: ${message}`);
  }
}

function flattenKeys(value, prefix = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out = [];
    for (const [key, next] of Object.entries(value)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      out.push(...flattenKeys(next, fullKey));
    }
    return out;
  }

  // Leaf nodes: strings/numbers/booleans/null/arrays
  return prefix ? [prefix] : [];
}

function diffSets(base, other) {
  const missing = [];
  for (const key of base) {
    if (!other.has(key)) missing.push(key);
  }

  const extra = [];
  for (const key of other) {
    if (!base.has(key)) extra.push(key);
  }

  missing.sort();
  extra.sort();

  return { missing, extra };
}

function checkFolder(folderPath, label) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const localeFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();

  if (!localeFiles.includes("en.json")) {
    throw new Error(`${label}: expected en.json in ${folderPath}`);
  }

  const byLocale = new Map();

  for (const file of localeFiles) {
    const locale = path.basename(file, ".json");
    const json = readJson(path.join(folderPath, file));
    const keys = new Set(flattenKeys(json));
    byLocale.set(locale, keys);
  }

  const base = byLocale.get("en");
  if (!base) throw new Error(`${label}: failed to load en keys`);

  let ok = true;

  for (const [locale, keys] of byLocale.entries()) {
    if (locale === "en") continue;
    const { missing, extra } = diffSets(base, keys);

    if (missing.length || extra.length) {
      ok = false;
      console.log(`\n${label}: ${locale}.json`);
      if (missing.length) {
        console.log(`  Missing (${missing.length}):`);
        for (const key of missing) {
          console.log(`    - ${key}`);
        }
      }
      if (extra.length) {
        console.log(`  Extra (${extra.length}):`);
        for (const key of extra) {
          console.log(`    - ${key}`);
        }
      }
    }
  }

  if (ok) {
    console.log(`${label}: OK (${localeFiles.length} locales)`);
  }

  return ok;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const messagesDir = path.join(root, "messages");
  const zodDir = path.join(messagesDir, "zod");

  let ok = true;
  ok = checkFolder(messagesDir, "messages") && ok;
  ok = checkFolder(zodDir, "messages/zod") && ok;

  if (!ok) process.exit(1);
}

main();
