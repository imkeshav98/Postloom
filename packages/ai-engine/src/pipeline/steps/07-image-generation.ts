import { z } from "zod";
import { prisma } from "@autoblog/database";
import { v2 as cloudinary } from "cloudinary";
import { generateImage } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { ArticleWritingOutput } from "./06-article-writing.js";

// ─── Cloudinary setup ──────────────────────────────────────────────────────

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
  title: z.string(),
  postId: z.string(),
  imagePrompt: z.string(),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  keywordId: z.string(),
  keyword: z.string(),
  contentPlanId: z.string(),
  title: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  categorySlug: z.string(),
  isPillar: z.boolean(),
  clusterGroup: z.string(),
  postId: z.string(),
  contentMarkdown: z.string(),
  excerpt: z.string(),
  wordCount: z.number(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  imageId: z.string(),
  imageUrl: z.string(),
});

export type ImageGenerationInput = ArticleWritingOutput;
export type ImageGenerationOutput = z.infer<typeof outputSchema>;

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: ImageGenerationInput,
  context: StepContext,
): Promise<ImageGenerationOutput> {
  ensureCloudinary();
  const config = await getModelConfig(context.blogId);

  const prompt = input.imagePrompt;

  const imageBuffer = await generateImage({
    model: config.imageGeneration.model,
    prompt,
  });

  // Upload to Cloudinary
  const publicId = `autoblog/${context.blogId}/${input.slug}-thumbnail`;

  const uploadResult = await new Promise<{ secure_url: string; width: number; height: number; format: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: undefined, // public_id already includes the path
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as any);
      },
    );
    stream.end(imageBuffer);
  });

  const imageUrl = uploadResult.secure_url;

  // Create or update Image record — prevents duplicates if step reruns on retry
  const existing = await prisma.image.findFirst({
    where: { postId: input.postId },
  });

  const image = existing
    ? await prisma.image.update({
        where: { id: existing.id },
        data: {
          url: imageUrl,
          prompt,
          altText: `${input.title} — thumbnail illustration`,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
        },
      })
    : await prisma.image.create({
        data: {
          url: imageUrl,
          altText: `${input.title} — thumbnail illustration`,
          prompt,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          postId: input.postId,
        },
      });

  console.log(`    [Image Generation] Uploaded to Cloudinary: ${imageUrl}`);

  return {
    ...input,
    imageId: image.id,
    imageUrl,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const imageGeneration: PipelineStep<
  ImageGenerationInput,
  ImageGenerationOutput
> = {
  stepName: "image-generation",
  inputSchema: inputSchema as unknown as z.ZodSchema<ImageGenerationInput>,
  outputSchema,
  execute,
};
