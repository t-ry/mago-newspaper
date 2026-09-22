import { z } from "zod";

const text = (max) => z.string().trim().min(1).max(max);
export const articleSchema = z.object({
  photoId: text(80),
  headline: text(28),
  body: text(180),
  reason: text(100),
});
export const editorialSchema = z.object({
  headline: text(32),
  intro: text(120),
  articles: z.array(articleSchema).min(1).max(3),
  message: text(100),
});
export const createSchema = z
  .object({
    mode: z.enum(["demo", "live"]),
    childName: text(16),
    note: z.string().trim().max(500).default(""),
    photos: z
      .array(
        z.object({
          id: text(80),
          dataUrl: z
            .string()
            .max(2_800_000)
            .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/),
        }),
      )
      .min(1)
      .max(12),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.photos.map((p) => p.id)).size !== value.photos.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "写真IDが重複しています。",
      });
  });
export const editSchema = editorialSchema.extend({
  revision: z.number().int().positive(),
});
export const revisionSchema = z.object({
  revision: z.number().int().positive(),
});
export const orderSchema = revisionSchema.extend({
  recipient: z.object({
    name: text(60),
    postalCode: z.string().regex(/^\d{3}-?\d{4}$/),
    address: text(180),
  }),
});

export function validateEditorial(value, photos) {
  const editorial = editorialSchema.parse(value);
  const ids = editorial.articles.map((a) => a.photoId);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !photos.some((p) => p.id === id))
  )
    throw new Error("掲載写真の指定が不正です。もう一度生成してください。");
  return editorial;
}
