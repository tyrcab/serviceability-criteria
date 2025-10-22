/**
 * bump-version.js
 * -----------------
 * Auto-increments the version in:
 *   - service-worker.js
 *   - version.json
 * Adds a build timestamp.
 * Designed for use locally or in GitHub Actions.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// --- Configuration ---
const SERVICE_WORKER = path.resolve("service-worker.js");
const VERSION_JSON = path.resolve("version.json");

// --- Helper: increment version string v1.0.5 → v1.0.6 ---
function bumpVersion(oldVersion) {
  const match = oldVersion.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error(`Invalid version format: ${oldVersion}`);
  const [_, major, minor, patch] = match.map(Number);
  return `v${major}.${minor}.${patch + 1}`;
}

// --- Get current timestamp (AEST or local) ---
function buildTimestamp() {
  const now = new Date();
  return now.toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
}

// --- Step 1: Read version.json ---
const versionData = JSON.parse(fs.readFileSync(VERSION_JSON, "utf8"));
const oldVersion = versionData.version;
const newVersion = bumpVersion(oldVersion);
const timestamp = buildTimestamp();

console.log(`🔢 Bumping version: ${oldVersion} → ${newVersion}`);
console.log(`🕒 Build time: ${timestamp}`);

// --- Step 2: Update version.json ---
versionData.version = newVersion;
versionData.buildTime = timestamp;
fs.writeFileSync(VERSION_JSON, JSON.stringify(versionData, null, 2));

// --- Step 3: Update service-worker.js ---
let swContent = fs.readFileSync(SERVICE_WORKER, "utf8");
swContent = swContent.replace(
  /const APP_VERSION = "v\d+\.\d+\.\d+"/,
  `const APP_VERSION = "${newVersion}"`
);
fs.writeFileSync(SERVICE_WORKER, swContent);

console.log("✅ Updated service-worker.js and version.json");

// --- Step 4: Git commit & push ---
try {
  execSync(`git config user.name "github-actions[bot]"`);
  execSync(`git config user.email "github-actions[bot]@users.noreply.github.com"`);
  execSync(`git add ${SERVICE_WORKER} ${VERSION_JSON}`);
  execSync(`git commit -m "🔄 Auto-bump to ${newVersion} (${timestamp})" || echo "No changes to commit"`);
  execSync(`git push`);
  console.log("🚀 Changes committed and pushed to GitHub");
} catch (err) {
  console.error("⚠️ Git push failed:", err.message);
}
