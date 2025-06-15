// Basic utility tests that don't require complex dependencies

describe("Basic Utilities", () => {
  it("should perform basic math operations", () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(8 / 2).toBe(4);
  });

  it("should handle string operations", () => {
    const str = "Hello World";
    expect(str.length).toBe(11);
    expect(str.toLowerCase()).toBe("hello world");
    expect(str.toUpperCase()).toBe("HELLO WORLD");
  });

  it("should handle array operations", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
    expect(arr[0]).toBe(1);
    expect(arr[4]).toBe(5);
    expect(arr.includes(3)).toBe(true);
    expect(arr.includes(6)).toBe(false);
  });

  it("should handle object operations", () => {
    const obj = { name: "Test", age: 25 };
    expect(obj.name).toBe("Test");
    expect(obj.age).toBe(25);
    expect(Object.keys(obj)).toEqual(["name", "age"]);
  });
});

// Mock Date for consistent testing
describe("Date Operations", () => {
  it("should work with dates", () => {
    const date = new Date("2024-01-01");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January is 0
    expect(date.getDate()).toBe(1);
  });

  it("should format dates consistently", () => {
    const date = new Date("2024-01-01T12:00:00Z");
    expect(date.toISOString()).toContain("2024-01-01");
    expect(date.getTime()).toBeGreaterThan(0);
  });
});

// Simple validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

describe("Validation Functions", () => {
  describe("validateEmail", () => {
    it("should validate correct email formats", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.org")).toBe(true);
      expect(validateEmail("test+tag@example.co.uk")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should validate password length", () => {
      expect(validatePassword("password123")).toBe(true);
      expect(validatePassword("123456")).toBe(true);
    });

    it("should reject short passwords", () => {
      expect(validatePassword("12345")).toBe(false);
      expect(validatePassword("")).toBe(false);
    });
  });

  describe("formatTime", () => {
    it("should format 12-hour time correctly", () => {
      expect(formatTime("09:00")).toBe("9:00 AM");
      expect(formatTime("12:00")).toBe("12:00 PM");
      expect(formatTime("15:30")).toBe("3:30 PM");
      expect(formatTime("00:00")).toBe("12:00 AM");
    });
  });
});
