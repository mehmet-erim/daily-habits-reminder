import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create a test user
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      password: hashedPassword,
      name: "Demo User",
    },
  });

  console.log("✅ Created user:", user.email);

  // Create sample reminders
  const reminders = [
    {
      title: "Drink Water",
      description: "Stay hydrated by drinking a glass of water",
      category: "wellness",
      reminderTime: "09:00",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]), // Monday to Friday
      userId: user.id,
    },
    {
      title: "Take a Walk",
      description: "Get some fresh air and light exercise",
      category: "exercise",
      reminderTime: "14:00",
      daysOfWeek: JSON.stringify([0, 1, 2, 3, 4, 5, 6]), // Every day
      userId: user.id,
    },
    {
      title: "Mindfulness Break",
      description: "Take 5 minutes to practice mindfulness or meditation",
      category: "mindfulness",
      reminderTime: "11:30",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]), // Monday to Friday
      userId: user.id,
    },
    {
      title: "Healthy Lunch",
      description: "Eat a nutritious lunch with vegetables and protein",
      category: "nutrition",
      reminderTime: "12:30",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]), // Monday to Friday
      userId: user.id,
    },
    {
      title: "Evening Stretch",
      description: "Stretch your muscles before bed",
      category: "exercise",
      reminderTime: "20:00",
      daysOfWeek: JSON.stringify([0, 1, 2, 3, 4, 5, 6]), // Every day
      userId: user.id,
    },
  ];

  const createdReminders = [];
  for (const reminder of reminders) {
    const created = await prisma.reminder.upsert({
      where: {
        id: `${user.id}-${reminder.title.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {},
      create: {
        ...reminder,
        id: `${user.id}-${reminder.title.toLowerCase().replace(/\s+/g, "-")}`,
      },
    });
    createdReminders.push(created);
    console.log("✅ Created reminder:", created.title);
  }

  // Create sample counters for today
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const counters = [
    {
      name: "Water",
      unit: "ml",
      iconName: "Droplets",
      color: "#3b82f6",
      dailyGoal: 2000,
      currentValue: 500,
      date: today,
      userId: user.id,
    },
    {
      name: "Coffee",
      unit: "cups",
      iconName: "Coffee",
      color: "#8b5cf6",
      dailyGoal: 3,
      currentValue: 1,
      date: today,
      userId: user.id,
    },
    {
      name: "Steps",
      unit: "steps",
      iconName: "Footprints",
      color: "#10b981",
      dailyGoal: 10000,
      currentValue: 3500,
      date: today,
      userId: user.id,
    },
    {
      name: "Reading",
      unit: "minutes",
      iconName: "BookOpen",
      color: "#f59e0b",
      dailyGoal: 30,
      currentValue: 15,
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
    console.log(
      "✅ Created counter:",
      created.name,
      `(${created.currentValue}/${created.dailyGoal} ${created.unit})`
    );
  }

  // Create some sample reminder logs for the past few days
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

  const sampleLogs = [
    // Yesterday's logs
    {
      action: "completed",
      date: yesterdayStr,
      userId: user.id,
      reminderId: createdReminders[0].id, // Water reminder
      timestamp: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000), // 9 AM yesterday
    },
    {
      action: "completed",
      date: yesterdayStr,
      userId: user.id,
      reminderId: createdReminders[1].id, // Walk reminder
      timestamp: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000), // 2 PM yesterday
    },
    {
      action: "dismissed",
      date: yesterdayStr,
      userId: user.id,
      reminderId: createdReminders[2].id, // Mindfulness reminder
      timestamp: new Date(yesterday.getTime() + 11.5 * 60 * 60 * 1000), // 11:30 AM yesterday
    },
    // Two days ago logs
    {
      action: "completed",
      date: twoDaysAgoStr,
      userId: user.id,
      reminderId: createdReminders[0].id, // Water reminder
      timestamp: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000),
    },
    {
      action: "snoozed",
      date: twoDaysAgoStr,
      userId: user.id,
      reminderId: createdReminders[1].id, // Walk reminder
      snoozeCount: 2,
      timestamp: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000),
    },
  ];

  for (const log of sampleLogs) {
    await prisma.reminderLog.create({
      data: log,
    });
  }

  console.log("✅ Created sample reminder logs");

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📊 Seeded data summary:");
  console.log(`- 1 demo user (email: ${user.email})`);
  console.log(`- ${createdReminders.length} sample reminders`);
  console.log(`- ${counters.length} daily counters`);
  console.log(`- ${sampleLogs.length} sample reminder logs`);
  console.log("\n🔑 Login credentials:");
  console.log("Email: demo@example.com");
  console.log("Password: password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
