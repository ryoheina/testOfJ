/**
 * Creates a downloadable zip bundle of the full project for Railway deployment.
 * Run: pnpm --filter @workspace/scripts run bundle
 */
import { ZipArchive } from "archiver";
import path from "path";
import fs from "fs";

const root = path.resolve(import.meta.dirname, "../..");
const zipPath = path.resolve(root, "kana-quiz-railway.zip");

const includes = [
  "artifacts/api-server",
  "artifacts/kana-quiz",
  "lib",
  "scripts",
  "Dockerfile",
  "railway.toml",
  "pnpm-workspace.yaml",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
];

console.log("Creating Railway deployment bundle...");

const output = fs.createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on("close", () => {
  const sizeMb = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\nBundle created: kana-quiz-railway.zip`);
  console.log(`Size: ${sizeMb} MB`);
  console.log("\nTo deploy on Railway:");
  console.log("1. Go to railway.app and create a new project");
  console.log("2. Push this project to a GitHub repo and connect it to Railway");
  console.log("   OR use the Railway CLI: railway up");
  console.log("3. Add these environment variables in the Railway dashboard:");
  console.log("   DATABASE_URL        = your PostgreSQL connection string");
  console.log("   NODE_ENV            = production");
  console.log("   ADMIN_PASSWORD      = your admin password");
  console.log("   DISCORD_WEBHOOK_URL = your webhook URL (optional)");
  console.log("   RESEND_API_KEY      = your Resend API key (optional, for email)");
  console.log("4. Railway auto-detects the Dockerfile and builds + deploys!");
});

archive.on("error", (err: Error) => { throw err; });
archive.pipe(output);

for (const include of includes) {
  const full = path.resolve(root, include);
  const stat = fs.statSync(full, { throwIfNoEntry: false });
  if (!stat) continue;

  if (stat.isDirectory()) {
    archive.glob("**/*", {
      cwd: full,
      dot: true,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.tsbuildinfo",
        "**/*.log",
        "**/__pycache__/**",
      ],
    }, { prefix: include });
  } else {
    archive.file(full, { name: include });
  }
}

await archive.finalize();
