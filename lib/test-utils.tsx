import React, { ReactElement } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockReminder = (overrides = {}) => ({
  id: 1,
  title: "Test Reminder",
  description: "Test Description",
  time: "09:00",
  isActive: true,
  daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  userId: 1,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-0101"),
  category: "wellness",
  sound: "default",
  ...overrides,
});

export const createMockReminderLog = (overrides = {}) => ({
  id: 1,
  reminderId: 1,
  userId: 1,
  action: "completed",
  timestamp: new Date(),
  scheduledTime: new Date(),
  ...overrides,
});

export const createMockCounter = (overrides = {}) => ({
  id: 1,
  name: "Water",
  value: 0,
  targetValue: 8,
  unit: "glasses",
  userId: 1,
  date: new Date().toISOString().split("T")[0],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock API responses
export const mockApiResponse = <T = any,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

export const mockApiError = (message = "API Error", status = 500) => ({
  ok: false,
  status,
  json: jest.fn().mockRejectedValue(new Error(message)),
  text: jest.fn().mockRejectedValue(new Error(message)),
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // Add any providers you want to wrap components with
  initialState?: any;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { initialState, ...renderOptions } = options;

  // You can add providers here as needed
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// User event setup
export const setupUser = () => userEvent.setup();

// Common test utilities
export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to complete
  await new Promise((resolve) => setTimeout(resolve, 0));
};

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};

export const mockSessionStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};

// Date utilities for testing
export const mockDate = (date: string | Date) => {
  const mockNow = new Date(date).getTime();
  jest.spyOn(Date, "now").mockReturnValue(mockNow);
  jest.spyOn(global, "Date").mockImplementation((...args) => {
    if (args.length === 0) {
      return new Date(mockNow);
    }
    return new Date(...args);
  });
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

// Mock timers utilities
export const advanceTimersByTime = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

export const runAllTimers = () => {
  jest.runAllTimers();
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing utilities
export const getByRoleWithTimeout = async (
  container: HTMLElement,
  role: string,
  timeout = 1000
) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      const element = container.querySelector(`[role="${role}"]`);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime < timeout) {
        setTimeout(check, 50);
      } else {
        resolve(null);
      }
    };
    check();
  });
};

// Network request mocking utilities
export const mockFetch = (mockResponse: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(mockResponse),
    text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
    status: ok ? 200 : 500,
  });
};

export const mockFetchError = (error: Error) => {
  global.fetch = jest.fn().mockRejectedValue(error);
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };
export { userEvent };
