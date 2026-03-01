import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing database...\n");

  // ── 0. Clear all data (order matters for FK constraints) ──────────────
  await prisma.pipelineStepRun.deleteMany();
  await prisma.pipelineRun.deleteMany();
  await prisma.internalLink.deleteMany();
  await prisma.image.deleteMany();
  await prisma.contentPlan.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.blog.deleteMany();

  console.log("Database cleared.\n");
  console.log("Seeding database...\n");

  // ── 1. Create sample blog ───────────────────────────────────────────────

  const blog = await prisma.blog.create({
    data: {
      name: "FitLife Hub",
      slug: "fitness-blog",
      domain: "fitlifehub.com",
      niche: "fitness",
      description:
        "Your guide to fitness, nutrition, and healthy living. Science-backed advice for every fitness level.",
      defaultAuthor: "FitLife Team",
      language: "en",
    },
  });

  console.log(`Blog created: ${blog.name} (${blog.id})`);

  // ── 2. Create site config ──────────────────────────────────────────────

  await prisma.siteConfig.create({
    data: {
      blogId: blog.id,
      palette: "default",
      postsPerPage: 10,
    },
  });

  console.log("Site config created.");

  // ── 3. Create 10 keywords (one per post the AI will generate) ─────────

  const keywords = [
    { keyword: "beginner workout plan", searchVolume: 14800, difficulty: 45, cpc: 1.2, intent: "INFORMATIONAL", trendScore: 0.8 },
    { keyword: "meal prep for beginners", searchVolume: 22000, difficulty: 38, cpc: 0.9, intent: "INFORMATIONAL", trendScore: 0.85 },
    { keyword: "strength training fundamentals", searchVolume: 8100, difficulty: 52, cpc: 1.5, intent: "INFORMATIONAL", trendScore: 0.7 },
    { keyword: "how to lose belly fat", searchVolume: 33000, difficulty: 60, cpc: 1.8, intent: "INFORMATIONAL", trendScore: 0.9 },
    { keyword: "best protein sources", searchVolume: 12000, difficulty: 35, cpc: 0.7, intent: "INFORMATIONAL", trendScore: 0.75 },
    { keyword: "morning stretching routine", searchVolume: 9500, difficulty: 30, cpc: 0.5, intent: "INFORMATIONAL", trendScore: 0.8 },
    { keyword: "HIIT workout at home", searchVolume: 18000, difficulty: 42, cpc: 1.3, intent: "INFORMATIONAL", trendScore: 0.88 },
    { keyword: "how to improve posture", searchVolume: 15000, difficulty: 40, cpc: 1.0, intent: "INFORMATIONAL", trendScore: 0.82 },
    { keyword: "post workout recovery tips", searchVolume: 7500, difficulty: 33, cpc: 0.8, intent: "INFORMATIONAL", trendScore: 0.7 },
    { keyword: "healthy snacks for weight loss", searchVolume: 20000, difficulty: 44, cpc: 1.1, intent: "INFORMATIONAL", trendScore: 0.86 },
  ] as const;

  for (const kw of keywords) {
    await prisma.keyword.create({
      data: { ...kw, blogId: blog.id },
    });
  }

  console.log(`${keywords.length} keywords created.`);

  // ── 4. Enqueue 10 GENERATE pipeline jobs ──────────────────────────────

  for (let i = 0; i < 10; i++) {
    await prisma.pipelineRun.create({
      data: {
        blogId: blog.id,
        type: "GENERATE",
        status: "QUEUED",
        priority: 0,
        idempotencyKey: `seed-generate-${Date.now()}-${i}`,
        input: { niche: blog.niche },
      },
    });
  }

  console.log("10 GENERATE pipeline jobs enqueued.");

  console.log(`\nSeed complete! Blog ID: ${blog.id}`);
  console.log("Start the worker to generate posts: pnpm --filter @autoblog/worker dev");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
