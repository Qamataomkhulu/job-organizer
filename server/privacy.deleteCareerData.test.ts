import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteCareerDataForUser: vi.fn().mockResolvedValue({ resumes: 2, matches: 25, unreferencedFiles: 2 }),
}));

vi.mock("./db", () => ({ deleteCareerDataForUser: mocks.deleteCareerDataForUser }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("privacy.deleteCareerData", () => {
  it("deletes only records associated with the authenticated user after the explicit confirmation", async () => {
    const ctx = {
      user: { id: 42, openId: "privacy-user", name: "Privacy User", email: "privacy@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} },
      res: {},
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);

    await expect(caller.privacy.deleteCareerData({ confirmation: "DELETE" })).resolves.toEqual({ resumes: 2, matches: 25, unreferencedFiles: 2 });
    expect(mocks.deleteCareerDataForUser).toHaveBeenCalledWith(42);
  });
});
