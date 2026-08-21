import { describe, expect, it } from "vitest";
import { addPreferredTitle, initialPreferredTitles } from "./preferredTitles";

describe("initialPreferredTitles", () => {
  it("keeps saved target titles ahead of previous-employer seed titles", () => {
    expect(initialPreferredTitles(["SOC Analyst", "Incident Responder"], ["SOC Team Lead", "SOC Analyst"])).toEqual(["SOC Team Lead", "SOC Analyst", "Incident Responder"]);
  });

  it("adds a selected employment-history title once without duplicating it", () => {
    expect(addPreferredTitle(["SOC Analyst"], "Incident Response Lead")).toEqual(["SOC Analyst", "Incident Response Lead"]);
    expect(addPreferredTitle(["SOC Analyst"], "soc analyst")).toEqual(["SOC Analyst"]);
  });
});
