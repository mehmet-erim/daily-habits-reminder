import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create a test user
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
    },
  });

  console.log("✅ Created test user:", user.email);

  // Create some sample reminders
  const reminders = [
    {
      title: "Morning Water",
      description: "Drink a glass of water to start your day",
      category: "hydration",
      reminderTime: "08:00",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]), // Monday to Friday
      userId: user.id,
    },
    {
      title: "Afternoon Walk",
      description: "Take a 10-minute walk to refresh yourself",
      category: "exercise",
      reminderTime: "14:00",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5, 6, 7]), // Every day
      userId: user.id,
    },
    {
      title: "Evening Meditation",
      description: "Practice mindfulness for 5 minutes",
      category: "wellness",
      reminderTime: "19:00",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5, 6, 7]), // Every day
      userId: user.id,
    },
  ];

  for (const reminder of reminders) {
    // Check if reminder already exists
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        userId: user.id,
        title: reminder.title,
      },
    });

    if (!existingReminder) {
      const created = await prisma.reminder.create({
        data: reminder,
      });
      console.log("✅ Created reminder:", created.title);
    } else {
      console.log("ℹ️ Reminder already exists:", reminder.title);
    }
  }

  // Create some sample counters for today
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const counters = [
    {
      name: "Water",
      unit: "glasses",
      iconName: "droplets",
      color: "#3b82f6",
      dailyGoal: 8,
      currentValue: 3,
      date: today,
      userId: user.id,
    },
    {
      name: "Coffee",
      unit: "cups",
      iconName: "coffee",
      color: "#a855f7",
      dailyGoal: 2,
      currentValue: 1,
      date: today,
      userId: user.id,
    },
  ];

  for (const counter of counters) {
    const created = await prisma.counter.upsert({
      where: {
        userId_name_date: {
          userId: user.id,
          name: counter.name,
          date: today,
        },
      },
      update: {},
      create: counter,
    });
    console.log("✅ Created counter:", created.name);
  }

  console.log("🎉 Database seeding completed!");
  console.log("📧 Test user email: test@example.com");
  console.log("🔑 Test user password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
