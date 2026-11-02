// Minimal .env loader — avoids needing the `dotenv` package as a dependency.
// Reads backend/.env if present and copies any values into process.env
// without overwriting variables the shell already set.

const fs = require("node:fs");
const path = require("node:path");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) return;

  const contents = fs.readFileSync(envPath, "utf8");

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip matching surrounding quotes, if any.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

module.exports = { loadEnv };
