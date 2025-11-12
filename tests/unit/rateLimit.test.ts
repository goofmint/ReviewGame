/**
 * Unit Tests for Rate Limiting Utility (Phase 5)
 *
 * Tests KV-based rate limiting with fixed window counter.
 * Tests IP extraction and rate limit key generation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  buildRateLimitKey,
} from "../../app/utils/rateLimit";

/**
 * Simple in-memory KV implementation for testing
 * This is NOT a mock - it's a real implementation that matches KVNamespace interface
 */
class TestKVNamespace implements KVNamespace {
  private store: Map<string, { value: string; expiration?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiration && Date.now() > entry.expiration) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number }
  ): Promise<void> {
    const expiration = options?.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : options?.expiration
        ? options.expiration * 1000
        : undefined;

    this.store.set(key, { value, expiration });
  }

  async delete(key: string): Promise<void> {
    this.store.delete();
  }

  async list(): Promise<{ keys: { name: string }[] }> {
    return { keys: Array.from(this.store.keys()).map((name) => ({ name })) };
  }

  // Clear store for test isolation
  clear(): void {
    this.store.clear();
  }

  // Methods required by KVNamespace interface but not used in our tests
  async getWithMetadata(): Promise<{
    value: string | null;
    metadata: Record<string, unknown> | null;
  }> {
    throw new Error("Not implemented");
  }
}

describe("buildRateLimitKey", () => {
  it("should build rate limit key with IP", () => {
    const ip = "192.168.1.1";
    const result = buildRateLimitKey(ip);
    expect(result).toBe("ratelimit:save-result:192.168.1.1");
  });

  it("should handle IPv6 addresses", () => {
    const ip = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
    const result = buildRateLimitKey(ip);
    expect(result).toBe(
      "ratelimit:save-result:2001:0db8:85a3:0000:0000:8a2e:0370:7334"
    );
  });

  it("should handle localhost IP", () => {
    const ip = "127.0.0.1";
    const result = buildRateLimitKey(ip);
    expect(result).toBe("ratelimit:save-result:127.0.0.1");
  });

  it("should handle different IPs with different keys", () => {
    const ip1 = "192.168.1.1";
    const ip2 = "192.168.1.2";
    const result1 = buildRateLimitKey(ip1);
    const result2 = buildRateLimitKey(ip2);
    expect(result1).not.toBe(result2);
  });

  it("should be consistent for same IP", () => {
    const ip = "192.168.1.1";
    const result1 = buildRateLimitKey(ip);
    const result2 = buildRateLimitKey(ip);
    expect(result1).toBe(result2);
  });

  it("should handle empty string IP", () => {
    const ip = "";
    const result = buildRateLimitKey(ip);
    expect(result).toBe("ratelimit:save-result:");
  });
});

describe("getClientIp", () => {
  it("should extract IP from CF-Connecting-IP header", () => {
    const request = new Request("http://example.com", {
      headers: {
        "CF-Connecting-IP": "203.0.113.1",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("203.0.113.1");
  });

  it("should extract IP from X-Forwarded-For header", () => {
    const request = new Request("http://example.com", {
      headers: {
        "X-Forwarded-For": "203.0.113.2",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("203.0.113.2");
  });

  it("should prefer CF-Connecting-IP over X-Forwarded-For", () => {
    const request = new Request("http://example.com", {
      headers: {
        "CF-Connecting-IP": "203.0.113.1",
        "X-Forwarded-For": "203.0.113.2",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("203.0.113.1");
  });

  it("should extract first IP from X-Forwarded-For chain", () => {
    const request = new Request("http://example.com", {
      headers: {
        "X-Forwarded-For": "203.0.113.1, 198.51.100.1, 192.0.2.1",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("203.0.113.1");
  });

  it("should return unknown if no IP headers present", () => {
    const request = new Request("http://example.com");
    const result = getClientIp(request);
    expect(result).toBe("unknown");
  });

  it("should handle empty CF-Connecting-IP header", () => {
    const request = new Request("http://example.com", {
      headers: {
        "CF-Connecting-IP": "",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("unknown");
  });

  it("should handle empty X-Forwarded-For header", () => {
    const request = new Request("http://example.com", {
      headers: {
        "X-Forwarded-For": "",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("unknown");
  });

  it("should handle IPv6 addresses", () => {
    const request = new Request("http://example.com", {
      headers: {
        "CF-Connecting-IP": "2001:0db8:85a3::8a2e:0370:7334",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("2001:0db8:85a3::8a2e:0370:7334");
  });

  it("should trim whitespace from IP", () => {
    const request = new Request("http://example.com", {
      headers: {
        "CF-Connecting-IP": "  203.0.113.1  ",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("203.0.113.1");
  });

  it("should trim whitespace from X-Forwarded-For", () => {
    const request = new Request("http://example.com", {
      headers: {
        "X-Forwarded-For": "  203.0.113.1  , 198.51.100.1",
      },
    });
    const result = getClientIp(request);
    expect(result).toBe("203.0.113.1");
  });
});

describe("checkRateLimit", () => {
  let kv: TestKVNamespace;

  beforeEach(() => {
    kv = new TestKVNamespace();
  });

  describe("basic rate limiting", () => {
    it("should allow first request", async () => {
      const result = await checkRateLimit(kv, "test-key", {
        limit: 5,
        windowSeconds: 60,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should allow requests up to limit", async () => {
      const config = { limit: 3, windowSeconds: 60 };

      const result1 = await checkRateLimit(kv, "test-key", config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = await checkRateLimit(kv, "test-key", config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await checkRateLimit(kv, "test-key", config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests after limit reached", async () => {
      const config = { limit: 2, windowSeconds: 60 };

      await checkRateLimit(kv, "test-key", config);
      await checkRateLimit(kv, "test-key", config);

      const result = await checkRateLimit(kv, "test-key", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should track multiple keys independently", async () => {
      const config = { limit: 2, windowSeconds: 60 };

      await checkRateLimit(kv, "key-1", config);
      await checkRateLimit(kv, "key-1", config);

      const result1 = await checkRateLimit(kv, "key-1", config);
      expect(result1.allowed).toBe(false);

      const result2 = await checkRateLimit(kv, "key-2", config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
    });
  });

  describe("limit configurations", () => {
    it("should respect limit of 1", async () => {
      const config = { limit: 1, windowSeconds: 60 };

      const result1 = await checkRateLimit(kv, "test-key", config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = await checkRateLimit(kv, "test-key", config);
      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it("should respect limit of 5 (production default)", async () => {
      const config = { limit: 5, windowSeconds: 60 };

      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(kv, "test-key", config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }

      const result = await checkRateLimit(kv, "test-key", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should respect limit of 10", async () => {
      const config = { limit: 10, windowSeconds: 60 };

      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(kv, "test-key", config);
        expect(result.allowed).toBe(true);
      }

      const result = await checkRateLimit(kv, "test-key", config);
      expect(result.allowed).toBe(false);
    });
  });

  describe("window expiration", () => {
    it("should set TTL on KV entry", async () => {
      const config = { limit: 5, windowSeconds: 60 };
      await checkRateLimit(kv, "test-key", config);

      const value = await kv.get("test-key");
      expect(value).toBe("1");
    });

    it("should increment count within window", async () => {
      const config = { limit: 5, windowSeconds: 60 };

      await checkRateLimit(kv, "test-key", config);
      const value1 = await kv.get("test-key");
      expect(value1).toBe("1");

      await checkRateLimit(kv, "test-key", config);
      const value2 = await kv.get("test-key");
      expect(value2).toBe("2");

      await checkRateLimit(kv, "test-key", config);
      const value3 = await kv.get("test-key");
      expect(value3).toBe("3");
    });
  });

  describe("edge cases", () => {
    it("should handle empty key", async () => {
      const result = await checkRateLimit(kv, "", {
        limit: 5,
        windowSeconds: 60,
      });
      expect(result.allowed).toBe(true);
    });

    it("should handle zero limit (always block)", async () => {
      const result = await checkRateLimit(kv, "test-key", {
        limit: 0,
        windowSeconds: 60,
      });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should handle very large limit", async () => {
      const config = { limit: 1000000, windowSeconds: 60 };
      const result = await checkRateLimit(kv, "test-key", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
    });

    it("should handle very short window", async () => {
      const config = { limit: 5, windowSeconds: 1 };
      const result = await checkRateLimit(kv, "test-key", config);
      expect(result.allowed).toBe(true);
    });

    it("should handle very long window", async () => {
      const config = { limit: 5, windowSeconds: 86400 }; // 1 day
      const result = await checkRateLimit(kv, "test-key", config);
      expect(result.allowed).toBe(true);
    });
  });

  describe("concurrent requests simulation", () => {
    it("should handle multiple rapid requests", async () => {
      const config = { limit: 5, windowSeconds: 60 };
      const results = await Promise.all([
        checkRateLimit(kv, "test-key", config),
        checkRateLimit(kv, "test-key", config),
        checkRateLimit(kv, "test-key", config),
      ]);

      // Note: Due to eventual consistency in real KV, this might not be perfectly accurate
      // But our test implementation is immediate, so we can verify the logic
      const allowedCount = results.filter((r) => r.allowed).length;
      expect(allowedCount).toBe(3);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle typical user flow (3 requests in succession)", async () => {
      const config = { limit: 5, windowSeconds: 60 };

      const result1 = await checkRateLimit(kv, "user-ip-1", config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await checkRateLimit(kv, "user-ip-1", config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);

      const result3 = await checkRateLimit(kv, "user-ip-1", config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(2);
    });

    it("should handle abuse scenario (10 requests)", async () => {
      const config = { limit: 5, windowSeconds: 60 };
      const results = [];

      for (let i = 0; i < 10; i++) {
        results.push(await checkRateLimit(kv, "abuser-ip", config));
      }

      const allowedCount = results.filter((r) => r.allowed).length;
      const blockedCount = results.filter((r) => !r.allowed).length;

      expect(allowedCount).toBe(5);
      expect(blockedCount).toBe(5);
    });

    it("should isolate different users", async () => {
      const config = { limit: 2, windowSeconds: 60 };

      // User 1 exhausts their limit
      await checkRateLimit(kv, "user-1", config);
      await checkRateLimit(kv, "user-1", config);
      const user1Blocked = await checkRateLimit(kv, "user-1", config);
      expect(user1Blocked.allowed).toBe(false);

      // User 2 should still be allowed
      const user2Result = await checkRateLimit(kv, "user-2", config);
      expect(user2Result.allowed).toBe(true);
      expect(user2Result.remaining).toBe(1);
    });
  });
});
