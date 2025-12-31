import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // extract auth token and verify
    const authHeader = request.headers.get("Authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
