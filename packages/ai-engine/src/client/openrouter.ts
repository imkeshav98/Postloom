import { OpenRouter } from "@openrouter/sdk";
import type { ChatGenerationParams } from "@openrouter/sdk/models";

// ─── Client singleton ───────────────────────────────────────────────────────

let client: OpenRouter | null = null;

function getClient(): OpenRouter {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    client = new OpenRouter({ apiKey });
  }
  return client;
}

// ─── Chat function ──────────────────────────────────────────────────────────

export interface ChatOptions {
  model: string;
  messages: ChatGenerationParams["messages"];
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
  };
  webSearch?: {
    enabled: boolean;
    searchPrompt?: string;
    maxResults?: number;
  };
  reasoning?: {
    effort: "low" | "medium" | "high";
  };
}

export async function chat(options: ChatOptions): Promise<string> {
  const { model, messages, temperature, maxTokens, jsonSchema, webSearch, reasoning } = options;

  const params: ChatGenerationParams = {
    model,
    messages,
    temperature,
    maxTokens: maxTokens ?? 4096,
  };

  // Request structured JSON output if schema provided
  if (jsonSchema) {
    params.responseFormat = {
      type: "json_schema",
      jsonSchema: {
        name: jsonSchema.name,
        strict: true,
        schema: jsonSchema.schema,
      },
    };
  }

  // Enable web search plugin
  if (webSearch?.enabled) {
    params.plugins = [{
      id: "web" as const,
      enabled: true,
      maxResults: webSearch.maxResults ?? 5,
      searchPrompt: webSearch.searchPrompt,
    }];
  }

  // Enable extended reasoning
  if (reasoning) {
    params.reasoning = { effort: reasoning.effort };
  }

  const response = await getClient().chat.send({
    chatGenerationParams: params,
    xTitle: "Postloom Worker",
  });

  // Non-streaming returns ChatResponse (not EventStream)
  if ("choices" in response) {
    const choice = response.choices[0];
    const content = choice?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error(`Empty response from ${model}`);
    }
    // Detect truncated responses (hit maxTokens limit)
    if (choice.finishReason === "length") {
      throw new Error(
        `Response from ${model} was truncated (finish_reason=length). ` +
        `Increase maxTokens or reduce prompt size.`,
      );
    }
    return content;
  }

  throw new Error(`Unexpected response type from ${model}`);
}

// ─── JSON chat helper ───────────────────────────────────────────────────────
// Calls chat() with a JSON schema and parses the response.

export async function chatJSON<T>(
  options: ChatOptions & { jsonSchema: NonNullable<ChatOptions["jsonSchema"]> },
): Promise<T> {
  const raw = await chat(options);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Failed to parse JSON from ${options.model}. ` +
      `Raw response (first 500 chars): ${raw.slice(0, 500)}`,
    );
  }

  // Validate that all required top-level keys exist (uses the JSON schema already provided)
  const schema = options.jsonSchema.schema;
  if (
    schema.required &&
    Array.isArray(schema.required) &&
    typeof parsed === "object" &&
    parsed !== null
  ) {
    const missing = (schema.required as string[]).filter(
      (key) => !(key in parsed),
    );
    if (missing.length > 0) {
      throw new Error(
        `AI response from ${options.model} missing required fields: [${missing.join(", ")}]. ` +
        `Got keys: [${Object.keys(parsed).join(", ")}]`,
      );
    }
  }

  return parsed as T;
}

// ─── Image generation ────────────────────────────────────────────────────────
// Generates images via OpenRouter. Returns base64 PNG data.
// Primary: Seedream 4.5, fallback: Riverflow v2 Pro.

export interface ImageGenOptions {
  model: string;
  prompt: string;
  fallbackModel?: string;
  aspectRatio?: string;  // e.g. "1:1", "16:9" — defaults to "16:9"
  imageSize?: string;    // e.g. "1K", "2K" — defaults to "2K"
}

// Image-only models use modalities: ["image"], multimodal use ["image", "text"]
const IMAGE_ONLY_MODELS = ["black-forest-labs/", "bytedance-seed/", "sourceful/"];

const FALLBACK_IMAGE_MODEL = "sourceful/riverflow-v2-pro";

export async function generateImage(options: ImageGenOptions): Promise<Buffer> {
  const imgCfg = { aspectRatio: options.aspectRatio, imageSize: options.imageSize };
  try {
    return await callImageAPIWithRetry(options.model, options.prompt, imgCfg);
  } catch (err) {
    const fallback = options.fallbackModel ?? FALLBACK_IMAGE_MODEL;
    console.log(`    [Image Generation] ${options.model} failed, falling back to ${fallback}`);
    return await callImageAPIWithRetry(fallback, options.prompt, imgCfg);
  }
}

interface ImageConfig { aspectRatio?: string; imageSize?: string }

async function callImageAPIWithRetry(model: string, prompt: string, imgCfg?: ImageConfig, maxRetries = 4): Promise<Buffer> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callImageAPI(model, prompt, imgCfg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = /429|rate.?limit|too many requests/i.test(msg);

      if (isRateLimit && attempt < maxRetries) {
        const waitMs = 15_000 * Math.pow(2, attempt); // 15s, 30s, 60s, 120s
        console.log(`    [Image Generation] Rate limited, waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

async function callImageAPI(model: string, prompt: string, imgCfg?: ImageConfig): Promise<Buffer> {
  const isImageOnly = IMAGE_ONLY_MODELS.some((p) => model.startsWith(p));

  const response = await getClient().chat.send({
    chatGenerationParams: {
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: isImageOnly ? ["image"] : ["image", "text"],
      imageConfig: { aspect_ratio: imgCfg?.aspectRatio ?? "16:9", image_size: imgCfg?.imageSize ?? "2K" },
    },
    xTitle: "Postloom Worker",
  });

  if (!("choices" in response)) {
    throw new Error(`Unexpected stream response from ${model}`);
  }

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error(`Empty response from ${model}`);
  }

  // Extract base64 image data — SDK types the `images` field natively
  if (message.images && message.images.length > 0) {
    for (const img of message.images) {
      if (img.imageUrl?.url) {
        const base64 = img.imageUrl.url.replace(/^data:image\/\w+;base64,/, "");
        return Buffer.from(base64, "base64");
      }
    }
  }

  // Fallback: check content array (some models put images inline)
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (typeof part === "object" && part !== null && "type" in part && part.type === "image_url") {
        const imgPart = part as { imageUrl?: { url?: string } };
        if (imgPart.imageUrl?.url) {
          const base64 = imgPart.imageUrl.url.replace(/^data:image\/\w+;base64,/, "");
          return Buffer.from(base64, "base64");
        }
      }
    }
  }

  throw new Error(
    `No image data in response from ${model}. ` +
    `Message keys: [${Object.keys(message)}], ` +
    `images: ${message.images?.length ?? "none"}, ` +
    `content type: ${typeof message.content}`,
  );
}
