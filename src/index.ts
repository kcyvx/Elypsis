import { Command } from "commander";
import { init } from "./commands/init";

const program = new Command();

program
  .name("elypsis")
  .description("Add login and register pages, with working auth, to a Next.js project.")
  .version("0.2.1");

program
  .command("init", { isDefault: true })
  .description("Set up authentication (Better Auth) in the current Next.js project")
  .option("-y, --yes", "skip confirmation prompts", false)
  .option("-f, --force", "overwrite files that already exist", false)
  .option("-d, --db <type>", "database to use: sqlite or postgres")
  .option("--cwd <path>", "path of the Next.js project", process.cwd())
  .action(init);

program.parse();
