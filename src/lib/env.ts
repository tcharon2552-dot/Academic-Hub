import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEW_API_BASE_URL: z.string().url().transform((value) => value.replace(/\/+$/, "")),
  NEW_API_KEY: z.string().min(1),
  APP_BASE_URL: z.string().url()
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
    throw new Error(`Missing or invalid environment variables: ${fields.join(", ")}`);
  }

  return result.data;
}
