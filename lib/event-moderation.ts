import "server-only";

import { MAX_EVENT_IMAGES } from "@/lib/event-images";
import { moderationCategoryLabel } from "@/lib/moderation-categories";
import { signedEventImageUrl } from "@/lib/event-storage";
import {
  buildTextFields,
  containsInsult,
  containsPhoneNumber,
  flaggedCategoriesFromApi,
  INSULT_CATEGORY,
  PHONE_CATEGORY,
  type ModeratableEventText,
  type ModerationApiCategoryResult,
} from "@/lib/moderation-text";

/**
 * Standalone OpenAI moderation for pending events.
 *
 * Text fields are sent as an array of plain strings, so each field gets its
 * own classification: packing them into one paragraph dilutes a short insult
 * below the model's threshold. Images go in a separate request because they
 * cannot be mixed with strings. Event photos live in a private bucket, so we
 * sign each object server-side, download it here, and send a data URL — no
 * public image URL ever has to exist. A missing key or a failed request is
 * non-fatal: the caller leaves the event pending for a human instead of
 * guessing. A clean pass never publishes by itself; it only marks the event
 * as approved by AI for the admin queue.
 */

const MODERATION_ENDPOINT = "https://api.openai.com/v1/moderations";
const MODERATION_MODEL = "omni-moderation-latest";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export type EventModerationStatus = "safe" | "flagged" | "error" | "unavailable";

export type EventModerationOutcome = {
  status: EventModerationStatus;
  /** True only when the event must be rejected. */
  flagged: boolean;
  /** Raw moderation category keys, persisted for the admin queue. */
  categories: string[];
  /** Persian explanation: the rejection reason, the AI approval, or why no
   * trustworthy check could run. Shown to both the admin and the organizer. */
  note: string;
};

export type EventModerationInput = ModeratableEventText & {
  /** Private-bucket object keys. */
  images: string[];
};

type ModerationPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type ModerationApiResponse = {
  results?: ModerationApiCategoryResult[];
};

/** One readable reason per family of OpenAI categories, in Persian. */
function rejectionReasons(categories: string[]): string[] {
  const reasons = new Set<string>();
  for (const category of categories) {
    if (category === PHONE_CATEGORY) {
      reasons.add("شماره تلفن");
    } else if (
      category === INSULT_CATEGORY ||
      category.startsWith("harassment") ||
      category.startsWith("hate")
    ) {
      reasons.add("توهین یا آزار");
    } else if (category.startsWith("sexual")) {
      reasons.add("محتوای جنسی");
    } else if (category.startsWith("illicit")) {
      reasons.add("فعالیت غیرقانونی");
    } else if (category.startsWith("self-harm")) {
      reasons.add("خودآسیبی");
    } else if (category.startsWith("violence")) {
      reasons.add("خشونت");
    } else {
      reasons.add(moderationCategoryLabel(category));
    }
  }
  return [...reasons];
}

function rejectionNote(categories: string[], imageWarning: string): string {
  const reasons = rejectionReasons(categories);
  const reason = reasons.length > 0 ? reasons.join("، ") : "محتوای نامناسب";
  return `رویداد به دلیل شامل شدن ${reason} رد شد.${imageWarning}`;
}

async function imageParts(keys: string[]): Promise<{ parts: ModerationPart[]; failed: number }> {
  const attempts = await Promise.allSettled(
    keys.slice(0, MAX_EVENT_IMAGES).map(async (key): Promise<ModerationPart> => {
      const url = await signedEventImageUrl(key);
      const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error(`image request failed: ${response.status}`);

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("image too large");

      const mime = response.headers.get("content-type")?.split(";")[0]?.trim();
      if (!mime?.startsWith("image/")) throw new Error("unexpected content type");

      return {
        type: "image_url",
        image_url: { url: `data:${mime};base64,${bytes.toString("base64")}` },
      };
    }),
  );

  const parts = attempts
    .filter((item): item is PromiseFulfilledResult<ModerationPart> => item.status === "fulfilled")
    .map((item) => item.value);
  return { parts, failed: attempts.length - parts.length };
}

async function apiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string } | string;
    };
    const message =
      typeof body.error === "string"
        ? body.error
        : body.error?.message;
    return message || `OpenAI با کد ${response.status} پاسخ داد.`;
  } catch {
    return `OpenAI با کد ${response.status} پاسخ داد.`;
  }
}

/**
 * One moderation request. Text must be sent as an array of plain strings: the
 * API merges an array of `{ type: "text" }` objects into a single string, which
 * dilutes every field again. Images cannot be mixed with strings, so they go
 * in their own request as tagged objects.
 */
async function postModeration(
  apiKey: string,
  input: string[] | ModerationPart[],
): Promise<{ ok: true; results: ModerationApiCategoryResult[] } | { ok: false; error: string }> {
  let response: Response;
  try {
    response = await fetch(MODERATION_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODERATION_MODEL, input }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { ok: false, error: "ارتباط با سرویس OpenAI برقرار نشد." };
  }

  if (!response.ok) {
    return { ok: false, error: `خطای OpenAI: ${await apiError(response)}` };
  }

  const body = (await response.json()) as ModerationApiResponse;
  return { ok: true, results: body.results ?? [] };
}

export async function moderateEventContent(
  input: EventModerationInput,
): Promise<EventModerationOutcome> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: "unavailable",
      flagged: false,
      categories: [],
      note: "کلید OPENAI_API_KEY تنظیم نشده است؛ بررسی هوشمند انجام نشد.",
    };
  }

  const { parts: images, failed } = await imageParts(input.images);
  const textCheck = await postModeration(apiKey, buildTextFields(input));
  if (!textCheck.ok) {
    return { status: "error", flagged: false, categories: [], note: textCheck.error };
  }

  let results = textCheck.results;
  if (images.length > 0) {
    const imageCheck = await postModeration(apiKey, images);
    if (!imageCheck.ok) {
      return { status: "error", flagged: false, categories: [], note: imageCheck.error };
    }
    results = [...results, ...imageCheck.results];
  }

  const flaggedCategories = flaggedCategoriesFromApi(results);

  if (containsPhoneNumber(input)) {
    flaggedCategories.add(PHONE_CATEGORY);
  }
  if (containsInsult(input)) {
    flaggedCategories.add(INSULT_CATEGORY);
  }

  const categories = [...flaggedCategories].sort();
  const imageWarning = failed > 0 ? ` ${failed} تصویر قابل بارگذاری نبود.` : "";

  if (categories.length > 0) {
    return {
      status: "flagged",
      flagged: true,
      categories,
      note: rejectionNote(categories, imageWarning),
    };
  }

  /* An unchecked image must not become an AI-approved event. */
  if (failed > 0) {
    return {
      status: "error",
      flagged: false,
      categories: [],
      note: `${failed} تصویر قابل بارگذاری نبود؛ تأیید هوش مصنوعی صادر نشد.`,
    };
  }

  return {
    status: "safe",
    flagged: false,
    categories: [],
    note: "OpenAI محتوا را ایمن تشخیص داد؛ انتشار هنوز نیاز به تأیید مدیر دارد.",
  };
}
