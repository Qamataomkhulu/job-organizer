import { describe, expect, it } from "vitest";
import { groupSourcesByFamily } from "./sourceGovernance";

describe("groupSourcesByFamily", () => {
  it("groups the source registry into clean governance families without treating proposed sources as enabled", () => {
    const groups = groupSourcesByFamily([
      { source: "jobicy", displayName: "Jobicy", adapterKind: "Public API", status: "approved" as const },
      { source: "dpsa", displayName: "DPSA Circular", adapterKind: "Government PDF", status: "approved" as const },
      { source: "greenhouse", displayName: "Greenhouse", adapterKind: "Public ATS feed", status: "pending" as const },
    ]);
    expect(groups.map(group => [group.family, group.sources.length])).toEqual([["Government", 1], ["Job platforms", 1], ["Company careers", 1]]);
  });
});
