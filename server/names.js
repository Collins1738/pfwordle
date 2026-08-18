/**
 * names.js — builds EMPLOYEE_MAP dynamically from roster.csv
 * Single source of truth: roster.csv controls both the word pool and employee enrichment data.
 */

const fs = require("fs");
const path = require("path");

function parseCSVLine(line) {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

const EMPLOYEE_MAP = {};

try {
  const raw = fs.readFileSync(path.join(__dirname, "roster.csv"), "utf8").replace(/\r/g, "");
  const lines = raw.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  const hi = (h) => headers.indexOf(h);

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    const name = parts[hi("name")]?.trim();
    if (!name) continue;
    const firstName = name.split(" ")[0].toUpperCase();
    if (!EMPLOYEE_MAP[firstName]) EMPLOYEE_MAP[firstName] = [];
    EMPLOYEE_MAP[firstName].push({
      fullName: name,
      title: parts[hi("title")]?.trim() || "",
      department: parts[hi("department")]?.trim() || "",
      slackTitle: parts[hi("slack_title")]?.trim() || "",
      avatarUrl: parts[hi("avatar_url")]?.trim() || "",
    });
  }
} catch (e) {
  console.warn("names.js: could not load roster.csv:", e.message);
}

module.exports = { EMPLOYEE_MAP };
