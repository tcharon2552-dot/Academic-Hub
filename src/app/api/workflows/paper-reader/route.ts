import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runPaperReaderWorkflow } from "@/lib/workflows/paper-reader";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: unknown;
      text?: unknown;
    };
    const result = await runPaperReaderWorkflow({
      userId: user.id,
      title: typeof body.title === "string" ? body.title : "",
      text: typeof body.text === "string" ? body.text : ""
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Paper reader workflow failed."
      },
      {
        status: 400
      }
    );
  }
}
