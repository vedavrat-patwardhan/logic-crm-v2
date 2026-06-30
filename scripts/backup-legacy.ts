import { backupAll } from "./_legacy";

async function main() {
  console.log("Backing up legacy databases…");
  await backupAll();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
