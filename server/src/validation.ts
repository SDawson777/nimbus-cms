import { z } from "zod";

export const PaginationQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((n) => n === undefined || Number.isFinite(n!), {
      message: "Invalid page",
    }),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine(
      (n) => n === undefined || (Number.isFinite(n!) && n! > 0 && n! <= 200),
      {
        message: "Invalid pageSize",
      },
    ),
});

export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data as z.infer<T>;
}
