import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "@/lib/auth";

describe("Auth Utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword456";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it("should handle empty password", async () => {
      const hash = await hashPassword("testpassword123");

      const isValid = await verifyPassword("", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("generateToken", () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
    };

    it("should generate a valid JWT token", () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different users", () => {
      const user1 = { ...mockUser, id: 1 };
      const user2 = { ...mockUser, id: 2 };

      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
    };

    it("should verify valid token", () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe(mockUser.id);
      expect(decoded?.username).toBe(mockUser.username);
      expect(decoded?.email).toBe(mockUser.email);
    });

    it("should reject invalid token", () => {
      const invalidToken = "invalid.token.here";
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it("should reject empty token", () => {
      const decoded = verifyToken("");
      expect(decoded).toBeNull();
    });

    it("should reject malformed token", () => {
      const malformedToken = "not-a-jwt-token";
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });
  });
});
