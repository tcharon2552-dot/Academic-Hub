import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApplicationError, submitTeamApplication } from "@/lib/applications";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const application = await submitTeamApplication({
      ...body,
      requesterUserId: user.id
    });

    return NextResponse.json(
      {
        application
      },
      {
        status: 201
      }
    );
  } catch (error) {
    const message =
      error instanceof ApplicationError || error instanceof Error ? error.message : "Team application failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
