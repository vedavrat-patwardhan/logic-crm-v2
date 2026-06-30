import { MongoClient } from "mongodb";
import { EJSON } from "bson";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Mongoose pluralized the real Atlas collection names.
export const CRM_COLLECTIONS = ["users", "companies", "calls"] as const;
export const JOBCARD_COLLECTIONS = ["jobs", "companies"] as const;

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function stamp(): string {
  // Deterministic-ish timestamp for the folder name.
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

/**
 * Dump every legacy collection (both databases) to local JSON files.
 * Returns the backup directory path.
 */
export async function backupAll(): Promise<string> {
  const dir = join(process.cwd(), "scripts", "backup", stamp());
  mkdirSync(dir, { recursive: true });

  const crm = new MongoClient(requireEnv("LEGACY_CRM_URI"));
  const jobcard = new MongoClient(requireEnv("LEGACY_JOBCARD_URI"));

  try {
    await crm.connect();
    await jobcard.connect();

    const crmDb = crm.db();
    for (const name of CRM_COLLECTIONS) {
      const docs = await crmDb.collection(name).find({}).toArray();
      writeFileSync(
        join(dir, `crm.${name}.json`),
        EJSON.stringify(docs, undefined, 2),
      );
      console.log(`  • crm.${name}: ${docs.length} docs`);
    }

    const jobDb = jobcard.db();
    for (const name of JOBCARD_COLLECTIONS) {
      const docs = await jobDb.collection(name).find({}).toArray();
      writeFileSync(
        join(dir, `jobData.${name}.json`),
        EJSON.stringify(docs, undefined, 2),
      );
      console.log(`  • jobData.${name}: ${docs.length} docs`);
    }
  } finally {
    await crm.close();
    await jobcard.close();
  }

  console.log(`✔ Backup written to ${dir}`);
  return dir;
}

/** Open both legacy clients for reading during migration. */
export async function openLegacy() {
  const crm = new MongoClient(requireEnv("LEGACY_CRM_URI"));
  const jobcard = new MongoClient(requireEnv("LEGACY_JOBCARD_URI"));
  await crm.connect();
  await jobcard.connect();
  return {
    crm,
    jobcard,
    crmDb: crm.db(),
    jobDb: jobcard.db(),
    async close() {
      await crm.close();
      await jobcard.close();
    },
  };
}
