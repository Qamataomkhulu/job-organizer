import { FitTierBadge } from "@/components/FitTierBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getJobCardMetadata, type JobCardTag } from "@/lib/jobCardMetadata";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Banknote, BriefcaseBusiness, CheckCircle2, Loader2, MapPin, RefreshCw, SlidersHorizontal, Wifi } from "lucide-react";
import { useMemo, useState } from "react";

const tiers = ["Direct matches", "Priority", "Strong", "Selective", "All"] as const;

function EligibilityTag({ tag }: { tag: JobCardTag }) {
  const isRemote = tag.kind === "remote";
  const Icon = isRemote ? Wifi : MapPin;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${isRemote ? "border-[#70c8bc]/35 bg-[#70c8bc]/10 text-[#a6ece3]" : "border-[#d7b66d]/35 bg-[#d7b66d]/10 text-[#eed99d]"}`}><Icon className="h-3.5 w-3.5" />{tag.label}</span>;
}

function EvidenceTag({ tag }: { tag: JobCardTag }) {
  const roleTag = tag.kind === "role";
  return <span className={`rounded-md border px-2 py-1 text-xs ${roleTag ? "border-[#d7b66d]/30 bg-[#d7b66d]/8 text-[#ead7a1]" : "border-white/10 bg-black/15 text-[#c7bfb2]"}`}>{tag.label}</span>;
}

export default function Shortlist() {
  const utils = trpc.useUtils();
  const [tier, setTier] = useState<(typeof tiers)[number]>("Direct matches");
  const dashboard = trpc.dashboard.get.useQuery();
  const refresh = trpc.jobs.refresh.useMutation({ onSuccess: () => utils.dashboard.get.invalidate() });
  const filtered = useMemo(() => (dashboard.data?.matches ?? []).filter(item => tier === "All" || (tier === "Direct matches" ? item.match.fitTier !== "Selective" : item.match.fitTier === tier)), [dashboard.data?.matches, tier]);

  if (dashboard.isLoading) return <div className="jo-page grid min-h-[70vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin jo-gold-text" /></div>;
  const hasResume = Boolean(dashboard.data?.latestResume);

  return <div className="jo-page mx-auto max-w-7xl space-y-6 px-1 py-2 sm:px-3 lg:px-6">
    <section className="flex flex-col justify-between gap-5 rounded-[28px] border border-[#d7b66d]/20 bg-[#0d0d0e] px-6 py-7 shadow-xl shadow-black/30 sm:flex-row sm:items-end sm:px-8"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] jo-teal-text"><BriefcaseBusiness className="h-4 w-4" /> Approved public vacancy data</div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#f5eee3]">Your opportunity shortlist</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#c9c0b3]">Roles are ranked around direct job-title alignment and documented profile evidence. The original posting remains the place to apply.</p></div>{hasResume && <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />Refresh live roles</Button>}</section>
    {!hasResume ? <EmptyShortlist /> : <><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2">{tiers.map(item => <button key={item} onClick={() => setTier(item)} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${tier === item ? "border-[#d7b66d]/60 bg-[#d7b66d]/15 text-[#f0d991]" : "border-white/8 bg-black/15 text-[#bcb1a2] hover:border-[#d7b66d]/30 hover:text-[#e8dece]"}`}>{item}</button>)}</div><span className="inline-flex items-center gap-2 text-sm text-[#aaa194]"><SlidersHorizontal className="h-4 w-4" />{filtered.length} opportunities shown</span></div><div className="grid gap-3">{filtered.map(({ match, job }, index) => {
      const metadata = getJobCardMetadata({ workMode: job.workMode, description: job.description, tagsJson: job.tagsJson, evidenceTagsJson: match.evidenceTagsJson, rationale: match.rationale });
      const sourceLabel = job.source === "adzuna" ? "Adzuna South Africa" : job.source === "gov-department" ? "SA Government department" : "Jobicy";
      const originalDestinationLabel = job.source === "gov-department" && !/\.pdf(?:[?#]|$)/i.test(job.sourceUrl) ? "View official listing" : job.source === "gov-department" ? "View official PDF" : "View opportunity";
      return <Card key={match.id} className="jo-card transition-shadow hover:shadow-xl"><CardContent className="grid gap-4 p-5 md:grid-cols-[56px_1fr_auto] md:items-start"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d7b66d]/25 bg-[#d7b66d]/10 text-sm font-semibold jo-gold-text">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold tracking-tight text-[#f1e9dd]">{job.title}</h2><FitTierBadge tier={match.fitTier} /></div><p className="mt-1 text-sm text-[#c0b6a8]">{job.employer} <span className="px-1 text-[#6f675c]">•</span> {job.location} <span className="px-1 text-[#6f675c]">•</span> {job.workMode}</p><p className="mt-1 text-xs font-medium text-[#978c7d]">Source: {sourceLabel}{job.source === "gov-department" && job.closingDate ? ` · Closes ${new Date(job.closingDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>{job.salaryText && <p className="mt-2 inline-flex items-start gap-1.5 text-sm font-medium text-[#aee5dc]"><Banknote className="mt-0.5 h-4 w-4 shrink-0" /><span><span className="font-semibold">Salary as listed:</span> {job.salaryText}</span></p>}{metadata.eligibilityTags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{metadata.eligibilityTags.map(tag => <EligibilityTag key={tag.label} tag={tag} />)}</div>}<div className="mt-4"><p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.13em] jo-gold-text"><CheckCircle2 className="h-3.5 w-3.5" /> Why this matches</p>{metadata.evidenceTags.length > 0 ? <div className="flex flex-wrap gap-2">{metadata.evidenceTags.map(tag => <EvidenceTag key={tag.label} tag={tag} />)}</div> : <p className="text-sm leading-5 text-[#aaa194]">{match.rationale}</p>}</div></div><div className="flex items-center gap-3 md:flex-col md:items-end"><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[.13em] jo-gold-text">Evidence Match</p><span className="text-lg font-semibold text-[#f0e2c8]">{match.score}</span><span className="text-xs text-[#a9a093]"> / 100</span></div><a className="inline-flex items-center gap-1.5 text-sm font-semibold jo-teal-text hover:text-[#9be1d7]" href={job.sourceUrl} target="_blank" rel="noreferrer">{originalDestinationLabel} <ArrowUpRight className="h-4 w-4" /></a></div></CardContent></Card>;
    })}</div>{filtered.length === 0 && <div className="rounded-2xl border border-dashed border-[#d7b66d]/25 bg-black/15 p-10 text-center text-sm text-[#b5ab9d]">{tier === "Direct matches" ? <div className="mx-auto max-w-xl space-y-4"><p>No direct South African or explicitly worldwide cybersecurity role is available in the current approved live source. Unrelated remote roles are deliberately excluded rather than presented as a match.</p><a className="inline-flex items-center gap-1.5 font-semibold jo-teal-text hover:text-[#9be1d7]" href="https://www.linkedin.com/jobs/search/?keywords=Cybersecurity%20Analyst%20OR%20SOC%20Analyst%20OR%20Information%20Security%20Analyst&location=South%20Africa" target="_blank" rel="noreferrer">Search direct cybersecurity roles on LinkedIn <ArrowUpRight className="h-4 w-4" /></a></div> : "No results in this view yet. Refresh live roles or choose another evidence-match tier."}</div>}</>}</div>;
}

function EmptyShortlist() { return <div className="rounded-[28px] border border-dashed border-[#d7b66d]/25 bg-[#121112] p-12 text-center shadow-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#d7b66d]/10"><BriefcaseBusiness className="h-6 w-6 jo-gold-text" /></div><h2 className="mt-5 text-lg font-semibold text-[#f2eadf]">Your opportunities will appear here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#aaa194]">Upload a text-based PDF résumé from the Overview page. The platform will extract your verified profile, pull approved live roles, and rank opportunities around the roles and skills you bring.</p></div>; }
