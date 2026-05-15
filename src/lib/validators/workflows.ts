import { z } from "zod";

export const paperReaderInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().trim().min(1).max(240),
  text: z.string().trim().min(40).max(40_000),
  documentId: z.string().min(1).optional()
});

export const writingPolishInputSchema = z.object({
  userId: z.string().min(1),
  text: z.string().trim().min(20).max(20_000),
  goal: z.string().trim().max(500).optional()
});

export const literatureReviewInputSchema = z.object({
  userId: z.string().min(1),
  question: z.string().trim().min(1).max(500),
  papers: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(240),
        abstract: z.string().trim().min(40).max(10_000)
      })
    )
    .min(2)
    .max(10)
});

export type PaperReaderInput = z.infer<typeof paperReaderInputSchema>;
export type WritingPolishInput = z.infer<typeof writingPolishInputSchema>;
export type LiteratureReviewInput = z.infer<typeof literatureReviewInputSchema>;
