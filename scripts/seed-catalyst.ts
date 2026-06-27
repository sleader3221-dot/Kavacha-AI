import { CATALYST_TABLES } from "../src/lib/catalyst/datastore";

console.log("Catalyst seed dry-run. Configure Catalyst credentials and import generated CSVs into:");
console.log(CATALYST_TABLES.join("\n"));
