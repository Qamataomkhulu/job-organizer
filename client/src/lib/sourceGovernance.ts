export type GovernanceSource = {
  source: string;
  displayName: string;
  adapterKind: string;
  status: "approved" | "pending" | "disabled";
};

export type SourceFamily = "Government" | "Job platforms" | "Company careers";

export function sourceFamily(source: GovernanceSource): SourceFamily {
  const value = `${source.source} ${source.displayName} ${source.adapterKind}`.toLowerCase();
  if (/(government|dpsa|municipal|vuku|public service)/.test(value)) return "Government";
  if (/(greenhouse|lever|ats|company careers)/.test(value)) return "Company careers";
  return "Job platforms";
}

export function groupSourcesByFamily<T extends GovernanceSource>(sources: T[]) {
  const families: SourceFamily[] = ["Government", "Job platforms", "Company careers"];
  return families.map(family => ({ family, sources: sources.filter(source => sourceFamily(source) === family) })).filter(group => group.sources.length > 0);
}
