import "dotenv/config";
import { defineConfig } from "prisma/config";
const databaseUrl = process.env.DATABASE_URL ?? "";
const schemaFile = databaseUrl.startsWith("file:")
    ? "prisma-local/schema.prisma.local"
    : "schema.prisma";
export default defineConfig({
    earlyAccess: true,
    schema: schemaFile,
});
