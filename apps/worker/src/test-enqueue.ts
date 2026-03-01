// Test script: enqueues a pipeline job for the worker to pick up.
// Usage: pnpm --filter @autoblog/worker test:enqueue
// Pass "generate" as an argument to enqueue a GENERATE job instead of RESEARCH.

import "./env.js";

import { prisma } from "@autoblog/database";

async function main() {
  const jobType = process.argv[2]?.toUpperCase() === "GENERATE" ? "GENERATE" : "RESEARCH";

  // Find the first blog (created by seed script)
  const blog = await prisma.blog.findFirst();

  if (!blog) {
    console.error("No blog found. Run `pnpm db:seed` first.");
    process.exit(1);
  }

  if (jobType === "GENERATE") {
    // For GENERATE, ensure we have keywords to work with
    const keywordCount = await prisma.keyword.count({
      where: { blogId: blog.id },
    });

    if (keywordCount === 0) {
      console.error("No keywords found. Run a RESEARCH job first.");
      process.exit(1);
    }

    // Ensure blog has a SiteConfig
    await prisma.siteConfig.upsert({
      where: { blogId: blog.id },
      create: {
        blogId: blog.id,
        palette: "default",
      },
      update: {},
    });

    const run = await prisma.pipelineRun.create({
      data: {
        blogId: blog.id,
        type: "GENERATE",
        status: "QUEUED",
        priority: 0,
        idempotencyKey: `test-generate-${Date.now()}`,
        input: { niche: blog.niche },
      },
    });

    console.log(`Enqueued GENERATE job:`);
    console.log(`  Run ID:   ${run.id}`);
    console.log(`  Blog:     ${blog.name} (${blog.niche})`);
    console.log(`  Keywords: ${keywordCount} available`);
    console.log(`  Status:   ${run.status}`);
  } else {
    const run = await prisma.pipelineRun.create({
      data: {
        blogId: blog.id,
        type: "RESEARCH",
        status: "QUEUED",
        priority: 0,
        idempotencyKey: `test-research-${Date.now()}`,
        input: { niche: blog.niche },
      },
    });

    console.log(`Enqueued RESEARCH job:`);
    console.log(`  Run ID: ${run.id}`);
    console.log(`  Blog:   ${blog.name} (${blog.niche})`);
    console.log(`  Status: ${run.status}`);
  }

  console.log(`\nStart the worker to process it: pnpm --filter @autoblog/worker dev`);

  await prisma.$disconnect();
}

main();
