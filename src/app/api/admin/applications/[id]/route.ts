import { NextResponse } from "next/server";
import { ApplicationError, reviewTeamApplication, type ReviewAction } from "@/lib/applications";

const reviewActions = new Set<ReviewAction>(["approve", "reject", "mark_contacted"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      action?: unknown;
      reviewerNote?: unknown;
    };
    const action = typeof body.action === "string" ? body.action : "";

    if (!reviewActions.has(action as ReviewAction)) {
      return NextResponse.json({ error: "Unsupported review action." }, { status: 400 });
    }

    const application = await reviewTeamApplication(id, action as ReviewAction, {
      reviewerNote: typeof body.reviewerNote === "string" ? body.reviewerNote : null
    });

    return NextResponse.json({
      application
    });
  } catch (error) {
    const message =
      error instanceof ApplicationError || error instanceof Error ? error.message : "Application review failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
