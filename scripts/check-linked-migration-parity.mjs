import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function parseMigrationList(output) {
  for (const line of output.split(/\r?\n/)) {
    try {
      const parsed = JSON.parse(line);
      if (Array.isArray(parsed?.migrations)) {
        return parsed.migrations.map((migration) => ({
          local: migration.local || null,
          remote: migration.remote || null,
        }));
      }
    } catch {
      // The CLI can also emit progress lines or a human-readable table.
    }
  }

  const rows = [];

  for (const rawLine of output.replace(/\u001b\[[0-9;]*m/g, "").split(/\r?\n/)) {
    if (!rawLine.includes("|")) continue;
    const cells = rawLine.split("|");
    if (cells.length < 2) continue;
    const local = cells[0].match(/\d{12,}/)?.[0] ?? null;
    const remote = cells[1].match(/\d{12,}/)?.[0] ?? null;
    if (local || remote) rows.push({ local, remote });
  }

  return rows;
}

export function compareMigrationVersions(localFiles, rows) {
  const local = new Set(localFiles);
  const listedLocal = new Set(rows.flatMap((row) => (row.local ? [row.local] : [])));
  const remote = new Set(rows.flatMap((row) => (row.remote ? [row.remote] : [])));

  return {
    unlistedLocal: [...local].filter((version) => !listedLocal.has(version)),
    localOnly: [...local].filter((version) => !remote.has(version)),
    remoteOnly: [...remote].filter((version) => !local.has(version)),
  };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const migrationsDirectory = path.join(root, "supabase", "migrations");
  const binary = path.join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "supabase.cmd" : "supabase",
  );
  const packageShim = path.join(
    root,
    "node_modules",
    "supabase",
    "dist",
    "supabase.js",
  );

  if (!existsSync(binary) && !existsSync(packageShim)) {
    throw new Error("The repository-pinned Supabase CLI is unavailable. Run npm ci first.");
  }

  const localFiles = readdirSync(migrationsDirectory)
    .map((name) => name.match(/^(\d{12,})_.*\.sql$/)?.[1])
    .filter(Boolean);
  const command = existsSync(binary) ? binary : process.execPath;
  const args = existsSync(binary)
    ? ["migration", "list", "--linked"]
    : [packageShim, "migration", "list", "--linked"];
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
    timeout: 60_000,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error("Unable to read linked migration history. Authenticate and link the intended project first.");
  }

  const comparison = compareMigrationVersions(
    localFiles,
    parseMigrationList(`${result.stdout}\n${result.stderr}`),
  );
  if (
    comparison.unlistedLocal.length ||
    comparison.localOnly.length ||
    comparison.remoteOnly.length
  ) {
    throw new Error(
      `Migration parity failed: local-only [${comparison.localOnly.join(", ")}], remote-only [${comparison.remoteOnly.join(", ")}], unlisted-local [${comparison.unlistedLocal.join(", ")}].`,
    );
  }

  console.log(`Migration parity verified for ${localFiles.length} migrations.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
