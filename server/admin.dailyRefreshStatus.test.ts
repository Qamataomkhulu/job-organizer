import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureJobicySource: vi.fn().mockResolvedValue({ dailyTaskUid: "daily-refresh" }),
  listHeartbeatJobs: vi.fn().mockResolvedValue({ total: 0, actorUserId: "owner" }),
}));

vi.mock("./jobOrganizer/service", () => ({
  ensureJobicySource: mocks.ensureJobicySource,
  createLatestOutputPackage: vi.fn(),
  ensureConfiguredSources: vi.fn(),
  refreshJobicyAndRankForUser: vi.fn(),
}));
vi.mock("./_core/heartbeat", () => ({
  createHeartbeatJob: vi.fn(),
  listHeartbeatJobs: mocks.listHeartbeatJobs,
  updateHeartbeatJob: vi.fn(),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin.dailyRefreshStatus", () => {
  it("returns null instead of throwing when the scheduler list omits its jobs array", async () => {
    const ctx = {
      user: { id: 1, openId: "admin", name: "Admin", email: "admin@example.com", loginMethod: "google", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;

    await expect(appRouter.createCaller(ctx).admin.dailyRefreshStatus()).resolves.toBeNull();
  });
});
