const fs = require("fs");

// Parse a CSV line respecting quoted fields
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

// Read a CSV file into an array of { header: value } objects (values trimmed)
function readCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "").replace(/\r/g, "");
  const lines = raw.trim().split("\n").filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const parts = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = parts[i]?.trim() || ""; });
    return row;
  });
}

module.exports = { parseCSVLine, readCSV };
