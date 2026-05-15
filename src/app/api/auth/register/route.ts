import { NextResponse } from "next/server";
import { AuthError, registerUser, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
    };

    const result = await registerUser({
      email: typeof body.email === "string" ? body.email : "",
      name: typeof body.name === "string" ? body.name : null
    });

    const response = NextResponse.json(
      {
        user: result.user,
        subscription: result.subscription
      },
      {
        status: 201
      }
    );

    response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: error.message
        },
        {
          status: 400
        }
      );
    }

    return NextResponse.json(
      {
        error: "Registration failed."
      },
      {
        status: 500
      }
    );
  }
}
