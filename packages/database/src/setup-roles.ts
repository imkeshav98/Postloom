import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Creates the restricted `blog_reader` PostgreSQL role and the
 * InternalLink same-blog constraint trigger.
 *
 * Run once after `prisma db push` creates the tables:
 *   pnpm db:setup-roles
 */
async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // ── 1. Create blog_reader role ──────────────────────────────────────────

    const blogReaderPassword = process.env.BLOG_READER_PASSWORD ?? "blog_reader_password";

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'blog_reader') THEN
          CREATE ROLE blog_reader WITH LOGIN PASSWORD '${blogReaderPassword}';
        END IF;
      END
      $$;
    `);

    // Grant connect + schema usage
    // Get current database name for GRANT CONNECT
    const dbResult = await prisma.$queryRawUnsafe<{ current_database: string }[]>(
      `SELECT current_database()`
    );
    const dbName = dbResult[0].current_database;
    await prisma.$executeRawUnsafe(`GRANT CONNECT ON DATABASE "${dbName}" TO blog_reader;`);
    await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO blog_reader;`);

    // Grant SELECT on public content tables only
    const publicTables = [
      "Blog",
      "Post",
      "Category",
      "Tag",
      "Image",
      "Page",
      "SiteConfig",
      "AffiliateLink",
      "InternalLink",
      "PostPerformance",
      "_PostToTag", // Prisma implicit many-to-many join table
    ];

    for (const table of publicTables) {
      await prisma.$executeRawUnsafe(`GRANT SELECT ON "${table}" TO blog_reader;`);
    }

    console.log("blog_reader role created and permissions granted.");

    // ── 2. InternalLink same-blog trigger ───────────────────────────────────

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION check_internal_link_same_blog()
      RETURNS TRIGGER AS $$
      DECLARE
        source_blog_id TEXT;
        target_blog_id TEXT;
      BEGIN
        SELECT "blogId" INTO source_blog_id FROM "Post" WHERE id = NEW."sourcePostId";
        SELECT "blogId" INTO target_blog_id FROM "Post" WHERE id = NEW."targetPostId";

        IF source_blog_id IS DISTINCT FROM target_blog_id THEN
          RAISE EXCEPTION 'Internal links must connect posts within the same blog. Source blog: %, Target blog: %',
            source_blog_id, target_blog_id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS enforce_internal_link_same_blog ON "InternalLink";
      CREATE TRIGGER enforce_internal_link_same_blog
        BEFORE INSERT OR UPDATE ON "InternalLink"
        FOR EACH ROW
        EXECUTE FUNCTION check_internal_link_same_blog();
    `);

    console.log("InternalLink same-blog trigger created.");
    console.log("\nSetup complete.");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
