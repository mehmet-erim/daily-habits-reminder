import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { getAvailableDateRange } from "@/lib/data-utils";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get available date range
    const availableRange = await getAvailableDateRange(userId);

    return NextResponse.json(availableRange, { status: 200 });
  } catch (error) {
    console.error("Error fetching available date range:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
