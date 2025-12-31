import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // extract and verify token
    const authHeader = request.headers.get("Authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const beforeTimestamp = searchParams.get("beforeTimestamp");

    // build query
    const whereClause = beforeTimestamp
      ? { timestamp: { lt: new Date(beforeTimestamp) } }
      : {};

    // fetch messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    // reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    return NextResponse.json({
      messages: chronologicalMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderName: msg.sender.name,
        senderAvatar: msg.sender.avatar,
        timestamp: msg.timestamp,
        status: msg.status,
        readBy: msg.readBy,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
