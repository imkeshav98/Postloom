import { z } from "zod";
import { prisma } from "@autoblog/database";
import { v2 as cloudinary } from "cloudinary";
import { generateImage } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { SetupPagesOutput } from "./setup-02-pages.js";

// ─── Cloudinary setup (same pattern as 07-image-generation.ts) ──────────────

let cloudinaryConfigured = false;

function ensureCloudinary() {
  if (cloudinaryConfigured) return;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set");
  }
  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
  cloudinaryConfigured = true;
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  categoryIds: z.array(z.string()),
  pagesCreated: z.number(),
  pageSlugs: z.array(z.string()),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  categoryIds: z.array(z.string()),
  pagesCreated: z.number(),
  pageSlugs: z.array(z.string()),
  logoUrl: z.string(),
  faviconUrl: z.string(),
  ogImageUrl: z.string(),
  heroImageUrl: z.string(),
});

export type SetupImagesInput = SetupPagesOutput;
export type SetupImagesOutput = z.infer<typeof outputSchema>;

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadToCloudinary(
  buffer: Buffer,
  publicId: string,
): Promise<{ secure_url: string; width: number; height: number; format: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: undefined,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as any);
      },
    );
    stream.end(buffer);
  });
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: SetupImagesInput,
  context: StepContext,
): Promise<SetupImagesOutput> {
  ensureCloudinary();
  const config = await getModelConfig(context.blogId);

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: context.blogId },
    select: { name: true, niche: true },
  });

  const imageModel = config.imageGeneration.model;

  // 1. Generate Logo (1:1 brand mark)
  console.log(`    [Setup Images] Generating logo...`);
  const logoBuffer = await generateImage({
    model: "google/gemini-2.5-flash-image",
    prompt: `A modern minimalist white ${blog.niche} symbol on pure black. Clean geometric shapes with slightly rounded edges. Flat 2D vector, bold and simple. Premium modern brand style, no 3D, no gradients, no extra detail, no text, no lettering. Black background edge to edge, no border, no margin.`,
    aspectRatio: "1:1",
    imageSize: "1K",
  });
  const logoResult = await uploadToCloudinary(
    logoBuffer,
    `autoblog/${context.blogId}/logo`,
  );
  console.log(`    [Setup Images] Logo uploaded: ${logoResult.secure_url}`);

  // 2. Favicon (use logo with Cloudinary resize transformation)
  const faviconUrl = cloudinary.url(`autoblog/${context.blogId}/logo`, {
    width: 32,
    height: 32,
    crop: "fill",
    format: "png",
    secure: true,
  });
  console.log(`    [Setup Images] Favicon URL: ${faviconUrl}`);

  // 3. Generate OG Image (1.91:1 social banner)
  console.log(`    [Setup Images] Generating OG image...`);
  const ogBuffer = await generateImage({
    model: imageModel,
    prompt: `A vibrant, eye-catching social media banner image for a ${blog.niche} blog called "${blog.name}". Modern design with bold colors and visual elements representing ${blog.niche}. 1200x630 pixel dimensions. No text, no lettering, no words.`,
  });
  const ogResult = await uploadToCloudinary(
    ogBuffer,
    `autoblog/${context.blogId}/og-image`,
  );
  console.log(`    [Setup Images] OG image uploaded: ${ogResult.secure_url}`);

  // 4. Generate Hero Image (16:9 banner)
  console.log(`    [Setup Images] Generating hero image...`);
  const heroBuffer = await generateImage({
    model: imageModel,
    prompt: `A wide panoramic hero banner for a ${blog.niche} blog. Lifestyle photography style showing a ${blog.niche}-relevant scene. Bright, inviting, and professional atmosphere. 16:9 aspect ratio. No text, no lettering, no words.`,
  });
  const heroResult = await uploadToCloudinary(
    heroBuffer,
    `autoblog/${context.blogId}/hero`,
  );
  console.log(`    [Setup Images] Hero image uploaded: ${heroResult.secure_url}`);

  // Update SiteConfig with image URLs
  await prisma.siteConfig.update({
    where: { blogId: context.blogId },
    data: {
      logoUrl: logoResult.secure_url,
      faviconUrl,
      ogImageUrl: ogResult.secure_url,
      heroImageUrl: heroResult.secure_url,
    },
  });

  // Also update Blog.logoUrl if not already set
  await prisma.blog.update({
    where: { id: context.blogId },
    data: { logoUrl: logoResult.secure_url },
  });

  console.log(`    [Setup Images] All 4 site images generated and stored`);

  return {
    ...input,
    logoUrl: logoResult.secure_url,
    faviconUrl,
    ogImageUrl: ogResult.secure_url,
    heroImageUrl: heroResult.secure_url,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const setupImages: PipelineStep<
  SetupImagesInput,
  SetupImagesOutput
> = {
  stepName: "setup-images",
  inputSchema: inputSchema as unknown as z.ZodSchema<SetupImagesInput>,
  outputSchema,
  execute,
};
