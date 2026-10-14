import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Sparkles, Target, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const demoJobs = [
  { title: "Security Operations Lead", employer: "Cape Secure", location: "Cape Town · Hybrid", score: 94, tier: "Priority" },
  { title: "Cyber Risk Manager", employer: "Mosaic Financial", location: "Johannesburg · Hybrid", score: 88, tier: "Strong" },
  { title: "Information Security Officer", employer: "Northstar Health", location: "Pretoria · On-site", score: 81, tier: "Strong" },
];

export default function StaticDemo() {
  const [, setLocation] = useLocation();
  const [cvName, setCvName] = useState("Demo résumé ready");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("This browser-only test does not send your file anywhere.");
  function uploadCv(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadMessage("Please choose a PDF résumé.");
      return;
    }
    setUploading(true);
    setUploadMessage("Reading your résumé in this browser…");
    window.setTimeout(() => {
      setCvName(file.name);
      setUploading(false);
      setUploadMessage("Résumé loaded for demo testing. Real AI extraction requires the full API.");
    }, 700);
  }
  return (
    <main className="min-h-screen bg-[#0b0b0c] px-4 py-6 text-[#f5eee3] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7b66d]/15 pb-5">
          <button onClick={() => setLocation("/")} className="flex items-center gap-3 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d7b66d]/15"><Sparkles className="h-5 w-5 jo-gold-text" /></div>
            <div><p className="font-semibold tracking-tight">Job Organizer</p><p className="text-xs text-[#a9a093]">Static demo mode</p></div>
          </button>
          <div className="flex gap-2"><Button variant="outline" onClick={() => setLocation("/")}>Back to landing</Button></div>
        </header>

        <section className="grid gap-6 py-10 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div><p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5cc9bd]/25 bg-[#5cc9bd]/10 px-3 py-1 text-xs font-medium text-[#9de1d8]"><CheckCircle2 className="h-3.5 w-3.5" /> Preview data · no account required</p><h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">A clear view of your next move.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#c9c0b3]">This GitHub Pages preview demonstrates the product experience without connecting to a database, authentication provider, storage bucket, or AI service. The CV upload test stays inside your browser.</p></div>
          <Card className="border-[#d7b66d]/20 bg-[#151313]"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#bdb4a5]">Profile readiness</span><span className="font-semibold jo-gold-text">86%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-[#d7b66d]" /></div><p className="mt-3 text-xs leading-5 text-[#aaa194]">Demo profile: Data engineering, security operations, and risk leadership.</p></CardContent></Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3"><Metric label="Current shortlist" value="12" detail="Ranked opportunities" icon={<Target className="h-5 w-5" />} /><Metric label="Direct matches" value="8" detail="Priority and Strong roles" icon={<CheckCircle2 className="h-5 w-5" />} /><Metric label="Documents ready" value="4" detail="CV and guidance outputs" icon={<FileText className="h-5 w-5" />} /></section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d7b66d]/10"><FileText className="h-5 w-5 jo-gold-text" /></div><div><h2 className="font-semibold">Evidence-led profile</h2><p className="text-sm text-[#aaa194]">Demo résumé processed</p></div></div><div className="mt-6 space-y-3 text-sm"><Row label="Strongest role family" value="Security operations" /><Row label="Experience signal" value="8+ years" /><Row label="Career direction" value="Data engineering" /><Row label="Source integrity" value="Approved sources" /></div><label className="mt-6 flex cursor-pointer items-center justify-center rounded-md bg-[#d7b66d] px-4 py-2 text-sm font-semibold text-[#171411] hover:bg-[#ecd28e]">
              {uploading ? "Reading résumé…" : "Upload a PDF résumé"}
              <input type="file" accept="application/pdf" className="sr-only" onChange={event => uploadCv(event.target.files?.[0])} disabled={uploading} />
            </label>
            <p className="mt-3 text-xs leading-5 text-[#aaa194]">{uploadMessage}</p></CardContent></Card>
          <Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Leading opportunities</h2><p className="mt-1 text-sm text-[#aaa194]">Example shortlist ranked from documented evidence.</p></div><Badge variant="outline" className="border-[#d7b66d]/30 text-[#e7d49a]">Top 25</Badge></div><div className="mt-5 space-y-3">{demoJobs.map(job => <div key={job.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 p-4"><div className="min-w-0"><p className="font-medium">{job.title}</p><p className="mt-1 text-xs text-[#aaa194]">{job.employer} · {job.location}</p></div><div className="text-right"><p className="font-semibold jo-gold-text">{job.score}</p><p className="text-[11px] text-[#aaa194]">{job.tier} match</p></div></div>)}</div></CardContent></Card>
        </section>
        <p className="mt-8 text-center text-xs text-[#77716a]">Static preview only. Uploads, sign-in, AI processing, storage, and live vacancies are disabled in this GitHub Pages build.</p>
      </div>
    </main>
  );
}
function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) { return <Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-[#bdb4a5]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div><span className="jo-gold-text">{icon}</span></div><p className="mt-3 text-xs text-[#9e9689]">{detail}</p></CardContent></Card>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3"><span className="text-[#aaa194]">{label}</span><span className="text-right font-medium text-[#e7ded0]">{value}</span></div>; }
