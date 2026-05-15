import { OwnerType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckoutOrder, PaymentError } from "@/lib/payments";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const order = await createCheckoutOrder({
      ...body,
      ownerType: body.ownerType ?? OwnerType.USER,
      ownerId: body.ownerId ?? user.id,
      userId: user.id
    });

    return NextResponse.json(
      {
        order
      },
      {
        status: 201
      }
    );
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          applicationHref: error.applicationHref
        },
        {
          status: error.code === "APPLICATION_REQUIRED" ? 409 : 400
        }
      );
    }

    return NextResponse.json({ error: "Checkout failed." }, { status: 400 });
  }
}
