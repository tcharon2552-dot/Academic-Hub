import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runWritingPolishWorkflow } from "@/lib/workflows/writing-polish";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      text?: unknown;
      goal?: unknown;
    };
    const result = await runWritingPolishWorkflow({
      userId: user.id,
      text: typeof body.text === "string" ? body.text : "",
      goal: typeof body.goal === "string" ? body.goal : undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Writing polish workflow failed."
      },
      {
        status: 400
      }
    );
  }
}
