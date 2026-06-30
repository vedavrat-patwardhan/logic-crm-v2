import { MongoClient } from "mongodb";

async function inspect(label: string, uri: string) {
  const c = new MongoClient(uri);
  await c.connect();
  const { databases } = await c.db().admin().listDatabases();
  console.log(`\n=== ${label} === (default db in URI: ${c.db().databaseName})`);
  for (const d of databases) {
    if (["admin", "local", "config"].includes(d.name)) continue;
    const db = c.db(d.name);
    const cols = await db.listCollections().toArray();
    console.log(` DB "${d.name}":`);
    for (const col of cols) {
      const n = await db.collection(col.name).estimatedDocumentCount();
      console.log(`   - ${col.name}: ${n}`);
    }
  }
  await c.close();
}

(async () => {
  await inspect("CRM", process.env.LEGACY_CRM_URI!);
  await inspect("JOBCARD", process.env.LEGACY_JOBCARD_URI!);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
