import { useAuth } from "@/_core/hooks/useAuth";
import { FitTierBadge } from "@/components/FitTierBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, CheckCircle2, CircleCheck, FileText, FileUp, Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";

function formattedDate(value?: Date | string | null) {
  if (!value) return "Not refreshed yet";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: React.ReactNode }) {
  return <Card className="jo-card"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[#bdb4a5]">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-[#f7f1e6]">{value}</p></div><div className="jo-gold-text">{icon}</div></div><p className="mt-3 text-xs leading-5 text-[#9e9689]">{detail}</p></CardContent></Card>;
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="rounded-2xl border border-[#d7b66d]/15 bg-black/15 p-4"><p className="text-xs font-semibold tracking-[.12em] jo-gold-text">{number}</p><p className="mt-2 text-sm font-semibold text-[#f2eadf]">{title}</p><p className="mt-1 text-xs leading-5 text-[#aaa194]">{text}</p></div>;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const dashboard = trpc.dashboard.get.useQuery();
  const refresh = trpc.jobs.refresh.useMutation({ onSuccess: () => utils.dashboard.get.invalidate() });
  const enableDailyRefresh = trpc.admin.enableDailyJobicyRefresh.useMutation({ onSuccess: () => utils.dashboard.get.invalidate() });
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState("");

  const tierCounts = useMemo(() => {
    const counts = { Priority: 0, Strong: 0, Selective: 0 };
    dashboard.data?.matches.forEach(item => { counts[item.match.fitTier] += 1; });
    return counts;
  }, [dashboard.data?.matches]);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Please choose a PDF résumé.");
      setUploadState("error");
      return;
    }
    setUploadState("uploading");
    setUploadError("");
    try {
      const response = await fetch("/api/resume/upload", { method: "POST", credentials: "include", headers: { "Content-Type": "application/pdf", "X-Filename": encodeURIComponent(file.name) }, body: file });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We could not process that résumé.");
      await utils.dashboard.get.invalidate();
      setUploadState("success");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "We could not process that résumé.");
      setUploadState("error");
    }
  }

  if (dashboard.isLoading) return <div className="jo-page grid min-h-[70vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin jo-gold-text" /></div>;

  const latest = dashboard.data?.latestResume;
  const topMatches = dashboard.data?.matches.slice(0, 3) ?? [];
  const approvedSourceCount = dashboard.data?.sources.filter(source => source.status === "approved" && source.enabled === 1).length ?? 0;
  const directMatchCount = tierCounts.Priority + tierCounts.Strong;

  return <div className="jo-page mx-auto max-w-7xl space-y-6 px-1 py-2 sm:px-3 lg:px-6">
    <section className="relative overflow-hidden rounded-[28px] border border-[#d7b66d]/20 bg-[#0d0d0e] px-6 py-8 shadow-2xl shadow-black/40 sm:px-9 sm:py-10">
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_at_center,rgba(221,181,89,.42),transparent_64%)] opacity-65" />
      <div className="relative grid gap-8 lg:grid-cols-[1.45fr_.85fr] lg:items-end">
        <div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7b66d]/25 bg-[#d7b66d]/10 px-3 py-1 text-xs font-medium text-[#e5d4a4]"><Sparkles className="h-3.5 w-3.5 jo-teal-text" /> Evidence-led career search</div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#f5eee3] sm:text-4xl">Your next role, <span className="jo-gold-text">organised.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#c9c0b3] sm:text-base">Your experience has value. We turn documented strengths into a verified profile, matched opportunities, and a practical route forward.</p></div>
        <Card className="border-[#d7b66d]/20 bg-black/25 text-[#f6efe4] shadow-none backdrop-blur-sm"><CardContent className="p-5"><div className="flex items-center justify-between text-sm"><span className="text-[#c8bdad]">Profile readiness</span><span className="font-semibold jo-gold-text">{latest ? "Ready" : "Start here"}</span></div><Progress value={latest ? 100 : 28} className="mt-3 h-2 bg-white/10" /><p className="mt-3 text-xs leading-5 text-[#bcb1a2]">{latest ? `${latest.strongestRoleFamily} is your strongest documented role family.` : "Upload a text-based PDF to create your evidence-led profile and shortlist."}</p></CardContent></Card>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3"><MetricCard label="Current shortlist" value={dashboard.data?.matches.length ?? 0} detail="Live opportunities ranked around verified evidence." icon={<Sparkles className="h-5 w-5" />} /><MetricCard label="Direct matches" value={directMatchCount} detail="Priority and Strong roles currently connected to your profile." icon={<CheckCircle2 className="h-5 w-5" />} /><MetricCard label="Approved sources" value={approvedSourceCount} detail="Public sources with an access basis and preserved application links." icon={<RefreshCw className="h-5 w-5" />} /></section>

    <section className="grid gap-5 lg:grid-cols-[.9fr_1.3fr]">
      <Card className="jo-card"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d7b66d]/12"><FileUp className="h-5 w-5 jo-gold-text" /></div><div><h2 className="font-semibold tracking-tight text-[#f2eadf]">Add or refresh your résumé</h2><p className="text-sm text-[#a9a093]">PDF only · extracted securely on the server</p></div></div><label className="mt-6 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7b66d]/35 bg-black/15 px-5 text-center transition-colors hover:border-[#d7b66d]/70 hover:bg-[#d7b66d]/5">{uploadState === "uploading" ? <Loader2 className="h-6 w-6 animate-spin jo-gold-text" /> : <FileUp className="h-6 w-6 text-[#cdbb91]" />}<span className="mt-3 text-sm font-medium text-[#e7ded0]">{uploadState === "uploading" ? "Extracting your verified experience…" : "Choose your PDF résumé"}</span><span className="mt-1 text-xs text-[#a9a093]">A master CV and guidance are generated from documented evidence only.</span><input type="file" accept="application/pdf" className="sr-only" onChange={onUpload} disabled={uploadState === "uploading"} /></label>{uploadState === "success" && <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300"><CircleCheck className="h-4 w-4" />Résumé processed. Your new shortlist is ready.</p>}{uploadState === "error" && <p className="mt-3 text-sm text-red-300">{uploadError}</p>}{latest && <div className="mt-5 rounded-xl border border-white/8 bg-black/15 p-4 text-sm"><p className="font-medium text-[#e7ded0]">Latest profile</p><p className="mt-1 text-[#a9a093]">{latest.originalFilename} · {latest.strongestRoleFamily}</p></div>}</CardContent></Card>
      <Card className="jo-card"><CardContent className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold tracking-tight text-[#f2eadf]">A clear path forward</h2><p className="mt-1 text-sm text-[#a9a093]">Complexity behind the scenes. Simplicity in front.</p></div>{latest && <Button variant="outline" size="sm" className="border-[#d7b66d]/35 text-[#e7d49a] hover:bg-[#d7b66d]/10" onClick={() => refresh.mutate()} disabled={refresh.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />Refresh now</Button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-3"><FlowStep number="01" title="Understand yourself" text="Verified skills, experience, qualifications and career direction." /><FlowStep number="02" title="Discover possibilities" text={`${tierCounts.Priority} Priority · ${tierCounts.Strong} Strong matches`} /><FlowStep number="03" title="Move forward" text="CV, guidance, shortlist and application pack." /></div>{topMatches.length > 0 ? <div className="mt-6 border-t border-white/8 pt-5"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-[#e7ded0]">Leading opportunities</p><button className="inline-flex items-center gap-1 text-xs font-semibold jo-gold-text hover:text-[#f0d991]" onClick={() => setLocation("/shortlist")}>View shortlist <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="space-y-3">{topMatches.map(({ match, job }) => <div className="flex items-center justify-between gap-3" key={match.id}><div className="min-w-0"><p className="truncate text-sm font-medium text-[#e7ded0]">{job.title}</p><p className="truncate text-xs text-[#a9a093]">{job.employer} · {job.location} · Evidence Match {match.score}</p></div><FitTierBadge tier={match.fitTier} /></div>)}</div></div> : <div className="mt-6 rounded-xl border border-dashed border-[#d7b66d]/25 bg-black/15 p-5 text-sm text-[#b5ab9d]">Your next opportunity may already exist. Upload a text-based PDF so we can find the one that fits.</div>}</CardContent></Card>
    </section>

    <section className="flex flex-col gap-3 rounded-2xl border border-[#d7b66d]/20 bg-[#151313] px-5 py-4 text-sm text-[#c3b9aa] shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 shrink-0 jo-gold-text" /><p><span className="font-semibold text-[#f0e6d8]">Source integrity:</span> approved access, attribution, refresh controls, and preserved original application links.</p></div>{user?.role === "admin" && !dashboard.data?.sources.some(source => source.source === "jobicy" && "dailyTaskUid" in source && source.dailyTaskUid) && <Button size="sm" variant="outline" className="border-[#d7b66d]/35 text-[#e7d49a] hover:bg-[#d7b66d]/10" onClick={() => enableDailyRefresh.mutate()} disabled={enableDailyRefresh.isPending}>{enableDailyRefresh.isPending ? "Enabling…" : "Enable daily refresh"}</Button>}</section>
  </div>;
}
