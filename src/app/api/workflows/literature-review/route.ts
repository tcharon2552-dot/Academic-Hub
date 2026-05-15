import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runLiteratureReviewWorkflow } from "@/lib/workflows/literature-review";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      question?: unknown;
      papers?: unknown;
    };
    const result = await runLiteratureReviewWorkflow({
      userId: user.id,
      question: typeof body.question === "string" ? body.question : "",
      papers: Array.isArray(body.papers) ? body.papers : []
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Literature review workflow failed."
      },
      {
        status: 400
      }
    );
  }
}
