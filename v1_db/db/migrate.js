import Postgrator from "postgrator";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { dbConfig } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Create a client of your choice
  const client = new pg.Client(dbConfig);

  try {
    // Establish a database connection
    await client.connect();

    // Create postgrator instance
    const postgrator = new Postgrator({
      migrationPattern: __dirname + "/migrations/*",
      driver: "pg",
      database: dbConfig.database,
      schemaTable: "schemaversion",
      execQuery: (query) => client.query(query),
      execSqlScript: (sqlScript) => client.sqlScript(sqlScript),
    });

    console.dir(await postgrator.getMigrations())

    // Or migrate to max version (optionally can provide 'max')
    const applied = await postgrator.migrate();
    console.log(applied);
  } catch (error) {
    // If error happened partially through migrations,
    // error object is decorated with appliedMigrations
    console.error(error.appliedMigrations); // array of migration objects
  }

  // Once done migrating, close your connection.
  await client.end();
}
main();
