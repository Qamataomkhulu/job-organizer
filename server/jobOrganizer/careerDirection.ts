import type { ResumeProfile } from "./types";

export type RoleFamilyPath = {
  family: string;
  suggestedTitles: string[];
  sourceTitles: string[];
  reason: string;
};

type PathDefinition = Omit<RoleFamilyPath, "sourceTitles" | "reason"> & { anchors: string[] };

const PATHS: PathDefinition[] = [
  { family: "Security Operations", suggestedTitles: ["SOC Analyst", "SOC Team Lead", "Security Operations Analyst"], anchors: ["soc", "security operations", "security analyst", "siem", "security monitoring"] },
  { family: "Incident Response & Threat Hunting", suggestedTitles: ["Incident Response Analyst", "Threat Hunter", "Cyber Incident Manager"], anchors: ["incident response", "threat", "forensics", "incident manager"] },
  { family: "Detection Engineering & SIEM", suggestedTitles: ["Detection Engineer", "SIEM Engineer", "Security Platform Engineer"], anchors: ["siem", "qradar", "splunk", "detection", "use case"] },
  { family: "Vulnerability Management", suggestedTitles: ["Vulnerability Management Analyst", "Vulnerability Manager", "Security Assessment Specialist"], anchors: ["vulnerability", "penetration", "vapt", "assessment"] },
  { family: "Security Governance, Risk & Compliance", suggestedTitles: ["GRC Analyst", "Cyber Risk Analyst", "Security Compliance Manager"], anchors: ["governance", "risk", "compliance", "audit", "iso 27001"] },
  { family: "Cloud Security", suggestedTitles: ["Cloud Security Analyst", "Cloud Security Engineer", "Cloud Security Consultant"], anchors: ["cloud", "aws", "azure", "gcp", "kubernetes"] },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#/\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalFamily(value: string) {
  return normalize(value).replace(/\bsoc\b/g, "").replace(/\s+/g, " ").trim();
}

export function historyTitles(profile: ResumeProfile) {
  return Array.from(new Set(profile.employmentTimeline.map(entry => entry.title.trim()).filter(Boolean)));
}

export function exploreRoleFamilies(profile: ResumeProfile): RoleFamilyPath[] {
  const titles = historyTitles(profile);
  const combined = normalize([...titles, ...profile.skillKeywords, ...profile.roleFamilies, profile.strongestRoleFamily].join(" "));
  const paths = PATHS.flatMap(path => {
    const matchedAnchors = path.anchors.filter(anchor => combined.includes(normalize(anchor)));
    if (matchedAnchors.length === 0) return [];
    const supportingTitles = titles.filter(title => path.anchors.some(anchor => normalize(title).includes(normalize(anchor))));
    const sourceTitles = supportingTitles.length > 0 ? supportingTitles : titles.slice(0, 2);
    return [{ family: path.family, suggestedTitles: path.suggestedTitles, sourceTitles, reason: `Supported by ${matchedAnchors.slice(0, 2).join(" and ")} in your documented experience.` }];
  });
  const primary = profile.strongestRoleFamily.trim();
  if (primary && !paths.some(path => canonicalFamily(path.family) === canonicalFamily(primary))) {
    paths.unshift({ family: primary, suggestedTitles: profile.targetRoleTitles.slice(0, 3), sourceTitles: titles.slice(0, 2), reason: "Your strongest documented role family from the latest résumé." });
  }
  return paths.filter((path, index, all) => all.findIndex(other => canonicalFamily(other.family) === canonicalFamily(path.family)) === index).slice(0, 5);
}

export function activeCareerSearchTerms(profile: ResumeProfile) {
  const adjacentTitles = exploreRoleFamilies(profile).flatMap(path => path.suggestedTitles.slice(0, 1));
  return Array.from(new Set([...profile.targetRoleTitles, ...adjacentTitles]
    .map(title => title.trim())
    .filter(title => title.length >= 3)
    .map(title => `${title.slice(0, 120)}\u0000${normalize(title)}`)
  )).map(entry => entry.split("\u0000")[0]).slice(0, 8);
}
