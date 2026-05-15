import { OwnerType, PaymentMethod, PlanCode } from "@prisma/client";
import { z } from "zod";

export const checkoutInputSchema = z.object({
  userId: z.string().min(1).optional(),
  teamId: z.string().min(1).optional(),
  ownerType: z.nativeEnum(OwnerType),
  ownerId: z.string().min(1),
  ownerLabel: z.string().trim().max(160).optional(),
  planCode: z.nativeEnum(PlanCode),
  method: z.nativeEnum(PaymentMethod)
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
