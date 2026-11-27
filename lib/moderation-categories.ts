/**
 * Persian labels for the OpenAI Moderation categories. Kept free of
 * server-only imports so both the moderation helper and the console UI can
 * use the same vocabulary.
 */
export const MODERATION_CATEGORY_LABELS: Record<string, string> = {
  phone_numbers: "شماره تلفن",
  unsafe_content: "محتوای نامناسب",
  insults: "توهین یا آزار",
  harassment: "توهین یا آزار و اذیت",
  "harassment/threatening": "آزار همراه با تهدید",
  hate: "نفرت",
  "hate/threatening": "نفرت همراه با تهدید",
  illicit: "فعالیت غیرقانونی",
  "illicit/violent": "فعالیت غیرقانونی همراه با خشونت",
  "self-harm": "خودآسیبی",
  "self-harm/intent": "قصد خودآسیبی",
  "self-harm/instructions": "دستورالعمل خودآسیبی",
  sexual: "محتوای جنسی",
  "sexual/minors": "محتوای جنسی مربوط به افراد زیر ۱۸ سال",
  violence: "خشونت",
  "violence/graphic": "خشونت شدید",
};

export function moderationCategoryLabel(key: string): string {
  return MODERATION_CATEGORY_LABELS[key] ?? key;
}

export function moderationCategoryLabels(keys: string[]): string[] {
  return keys.map(moderationCategoryLabel);
}
