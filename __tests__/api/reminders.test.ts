/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/reminders/route";

// Mock the database
jest.mock("@/lib/prisma", () => ({
  prisma: {
    reminder: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require("@/lib/prisma");

describe("/api/reminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/reminders", () => {
    it("should fetch reminders successfully", async () => {
      const mockReminders = [
        {
          id: 1,
          title: "Test Reminder",
          description: "Test Description",
          time: "09:00",
          isActive: true,
          daysOfWeek: [1, 2, 3, 4, 5],
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.reminder.findMany.mockResolvedValue(mockReminders);

      const request = new NextRequest("http://localhost:3000/api/reminders");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockReminders);
      expect(prisma.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should handle database errors", async () => {
      prisma.reminder.findMany.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/reminders");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/reminders", () => {
    it("should create a reminder successfully", async () => {
      const newReminder = {
        title: "New Reminder",
        description: "New Description",
        time: "10:00",
        isActive: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        category: "wellness",
        sound: "default",
      };

      const createdReminder = {
        id: 2,
        ...newReminder,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.reminder.create.mockResolvedValue(createdReminder);

      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify(newReminder),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdReminder);
      expect(prisma.reminder.create).toHaveBeenCalledWith({
        data: {
          ...newReminder,
          userId: 1,
        },
      });
    });

    it("should validate required fields", async () => {
      const invalidReminder = {
        description: "Missing title",
      };

      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify(invalidReminder),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle database creation errors", async () => {
      const newReminder = {
        title: "New Reminder",
        description: "New Description",
        time: "10:00",
        isActive: true,
        daysOfWeek: [1, 2, 3, 4, 5],
      };

      prisma.reminder.create.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: JSON.stringify(newReminder),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should handle invalid JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/reminders", {
        method: "POST",
        body: "invalid json",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
