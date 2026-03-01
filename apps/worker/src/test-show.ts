import "./env.js";
import { prisma } from "@postloom/database";

async function main() {
  // Get the most recent AI-generated draft post with SEO metadata
  const post = await prisma.post.findFirst({
    where: { aiGenerated: true, status: "DRAFT", metaTitle: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      category: { select: { name: true, slug: true } },
      outgoingLinks: { include: { targetPost: { select: { title: true } } } },
    },
  });

  if (!post) { console.log("No post found"); return; }

  console.log("=== POST ===");
  console.log(`Title: ${post.title}`);
  console.log(`Slug: ${post.slug}`);
  console.log(`Status: ${post.status}`);
  console.log(`Category: ${post.category?.name ?? "none"}`);
  console.log(`Word Count: ${post.wordCount}`);
  console.log(`Focus Keyword: ${post.focusKeyword}`);
  console.log(`Meta Title: ${post.metaTitle}`);
  console.log(`Meta Description: ${post.metaDescription}`);
  console.log(`Secondary Keywords: ${post.secondaryKeywords?.join(", ")}`);
  console.log(`Reading Time: ${post.readingTime} min`);
  console.log(`AI Model: ${post.aiModel}`);

  console.log("\n=== CONTENT (first 2000 chars) ===");
  console.log(post.contentMarkdown.slice(0, 2000));

  console.log("\n=== FAQ ===");
  if (post.faqData && Array.isArray(post.faqData)) {
    for (const faq of post.faqData as any[]) {
      console.log(`Q: ${faq.question}`);
      console.log(`A: ${faq.answer}\n`);
    }
  }

  console.log("=== IMAGES ===");
  for (const img of post.images) {
    console.log(`URL: ${img.url}`);
    console.log(`Alt: ${img.altText}`);
    console.log(`Size: ${img.width}x${img.height} ${img.format}`);
  }

  console.log("\n=== INTERNAL LINKS ===");
  for (const link of post.outgoingLinks) {
    console.log(`→ "${link.targetPost.title}" (anchor: ${link.anchorText})`);
  }

  // Show image file path
  if (post.images.length > 0) {
    const imgUrl = post.images[0].url;
    const fullPath = `c:/Users/imkes/Desktop/Personal/Postloom${imgUrl.replace(/\//g, "/")}`;
    console.log(`\n=== IMAGE FILE PATH ===`);
    console.log(fullPath);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
