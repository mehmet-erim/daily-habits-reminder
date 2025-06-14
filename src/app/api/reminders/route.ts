import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { createReminderSchema, formatDaysOfWeek } from "@/lib/validations";
import { z } from "zod";

// GET /api/reminders - Get all reminders for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("active");

    // Build filter conditions
    const where: any = {
      userId: payload.userId,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    // Fetch reminders with ordering
    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: [
        { isActive: "desc" },
        { reminderTime: "asc" },
        { title: "asc" },
      ],
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST /api/reminders - Create new reminder
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();

    try {
      const validatedData = createReminderSchema.parse(body);

      // Create reminder in database
      const reminder = await prisma.reminder.create({
        data: {
          ...validatedData,
          daysOfWeek: formatDaysOfWeek(validatedData.daysOfWeek),
          userId: payload.userId,
        },
      });

      return NextResponse.json({ reminder }, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
