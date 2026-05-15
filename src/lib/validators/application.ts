import { PaymentMethod, PlanCode } from "@prisma/client";
import { z } from "zod";

export const teamApplicationInputSchema = z.object({
  requesterUserId: z.string().min(1),
  applicantName: z.string().trim().min(1).max(120),
  institution: z.string().trim().min(1).max(160),
  labName: z.string().trim().min(1).max(160),
  contactEmail: z.string().trim().email(),
  desiredPlanCode: z.enum([PlanCode.B2, PlanCode.B3]),
  memberCount: z.coerce.number().int().min(2).max(5_000),
  useCase: z.string().trim().min(20).max(4_000),
  invoiceRequired: z.coerce.boolean().default(false),
  contractRequired: z.coerce.boolean().default(false),
  paymentPreference: z.nativeEnum(PaymentMethod)
});

export type TeamApplicationInput = z.infer<typeof teamApplicationInputSchema>;
