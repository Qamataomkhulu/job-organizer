import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Sparkles, Target, Eye, Download, BriefcaseBusiness } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const demoJobs = [
  ["Senior Data Engineer", "Cape Data Cloud", "Cape Town · Hybrid", 96, "Priority"],
  ["Analytics Engineer", "Mosaic Financial", "Johannesburg · Hybrid", 93, "Priority"],
  ["Data Platform Engineer", "Northstar Health", "Pretoria · Remote", 91, "Priority"],
  ["Cloud Data Engineer", "Ubuntu Systems", "Remote · South Africa", 89, "Strong"],
  ["ETL Developer", "Cedar Insurance", "Johannesburg · Hybrid", 87, "Strong"],
  ["Data Warehouse Engineer", "Kudu Retail", "Durban · Hybrid", 85, "Strong"],
  ["Machine Learning Data Engineer", "Signal Labs", "Cape Town · On-site", 84, "Strong"],
  ["BI Data Engineer", "Atlas Consulting", "Pretoria · Hybrid", 82, "Strong"],
  ["Database Reliability Engineer", "Harbour Bank", "Johannesburg · On-site", 80, "Good"],
  ["Data Integration Specialist", "Civic Digital", "Remote · South Africa", 78, "Good"],
  ["Junior Data Engineer", "Open Grid", "Cape Town · Hybrid", 75, "Good"],
  ["Data Quality Analyst", "Greenline Energy", "Port Elizabeth · Hybrid", 72, "Good"],
] as const;

const documents = [
  { id: "cv", title: "CV review", type: "Structured feedback", text: "Your strongest evidence is in SQL, Python, data pipelines, and production incident ownership. Add one measurable outcome to each project and move the data-platform achievements above general responsibilities." },
  { id: "profile", title: "Verified profile", type: "Extracted strengths", text: "Target direction: Data Engineering. Core signals: pipeline design, warehouse modelling, cloud fundamentals, stakeholder communication, and operational reliability." },
  { id: "cover", title: "Application letter", type: "Data engineering template", text: "A tailored application template is ready for data engineering roles. Replace the bracketed employer and platform details before sending." },
  { id: "plan", title: "90-day career plan", type: "Action checklist", text: "Weeks 1–4: strengthen SQL and dimensional modelling. Weeks 5–8: publish one pipeline project. Weeks 9–12: apply to priority roles and run mock system-design interviews." },
];

export default function StaticDemo() {
  const [, setLocation] = useLocation();
  const [cvName, setCvName] = useState("Demo résumé ready");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("This browser-only test does not send your file anywhere.");
  const [selectedDocument, setSelectedDocument] = useState(documents[0]);
  const [showAllJobs, setShowAllJobs] = useState(false);

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
      setUploadMessage("Résumé loaded. The matched jobs and review documents below are now available for demo review.");
    }, 700);
  }

  return (
    <main className="min-h-screen bg-[#0b0b0c] px-4 py-6 text-[#f5eee3] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7b66d]/15 pb-5">
          <button onClick={() => setLocation("/")} className="flex items-center gap-3 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d7b66d]/15"><Sparkles className="h-5 w-5 jo-gold-text" /></div>
            <div><p className="font-semibold tracking-tight">Job Organizer</p><p className="text-xs text-[#a9a093]">Full product demo</p></div>
          </button>
          <Button variant="outline" onClick={() => setLocation("/")}>Back to landing</Button>
        </header>

        <section className="grid gap-6 py-10 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div><p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#5cc9bd]/25 bg-[#5cc9bd]/10 px-3 py-1 text-xs font-medium text-[#9de1d8]"><CheckCircle2 className="h-3.5 w-3.5" /> CV workspace ready</p><h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Review every opportunity and every document in one place.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#c9c0b3]">Upload a PDF to test the flow, then review all 12 matched data engineering roles and the generated career documents below.</p></div>
          <Card className="border-[#d7b66d]/20 bg-[#151313]"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#bdb4a5]">Profile readiness</span><span className="font-semibold jo-gold-text">86%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-[#d7b66d]" /></div><p className="mt-3 text-xs text-[#aaa194]">Data engineering · security operations · risk leadership</p></CardContent></Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3"><Metric label="Current shortlist" value="12" detail="All matched opportunities" icon={<Target className="h-5 w-5" />} /><Metric label="Direct matches" value="8" detail="Priority and Strong roles" icon={<CheckCircle2 className="h-5 w-5" />} /><Metric label="Documents ready" value="4" detail="Reviewable career outputs" icon={<FileText className="h-5 w-5" />} /></section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d7b66d]/10"><FileText className="h-5 w-5 jo-gold-text" /></div><div><h2 className="font-semibold">Evidence-led profile</h2><p className="text-sm text-[#aaa194]">{cvName}</p></div></div><div className="mt-6 space-y-3 text-sm"><Row label="Strongest role family" value="Data engineering" /><Row label="Experience signal" value="8+ years" /><Row label="Career direction" value="Data engineering" /><Row label="Source integrity" value="Approved sources" /></div><label className="mt-6 flex cursor-pointer items-center justify-center rounded-md bg-[#d7b66d] px-4 py-2 text-sm font-semibold text-[#171411] hover:bg-[#ecd28e]">{uploading ? "Reading résumé…" : "Upload a PDF résumé"}<input type="file" accept="application/pdf" className="sr-only" onChange={event => uploadCv(event.target.files?.[0])} disabled={uploading} /></label><p className="mt-3 text-xs leading-5 text-[#aaa194]">{uploadMessage}</p></CardContent></Card>
          <Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Matched jobs</h2><p className="mt-1 text-sm text-[#aaa194]">All opportunities ranked from documented evidence.</p></div><Badge variant="outline" className="border-[#d7b66d]/30 text-[#e7d49a]">{showAllJobs ? "12 shown" : "Top 3"}</Badge></div><div className="mt-5 space-y-3">{demoJobs.slice(0, showAllJobs ? demoJobs.length : 3).map(([title, employer, location, score, tier]) => <div key={title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 p-4"><div className="min-w-0"><p className="font-medium">{title}</p><p className="mt-1 text-xs text-[#aaa194]">{employer} · {location}</p></div><div className="text-right"><p className="font-semibold jo-gold-text">{score}</p><p className="text-[11px] text-[#aaa194]">{tier} match</p></div></div>)}</div><Button variant="outline" className="mt-4 w-full" onClick={() => setShowAllJobs(value => !value)}>{showAllJobs ? "Show top matches" : "View all 12 matched jobs"}</Button></CardContent></Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-6"><div className="flex items-center gap-3"><BriefcaseBusiness className="h-5 w-5 jo-gold-text" /><div><h2 className="font-semibold">Career documents</h2><p className="text-sm text-[#aaa194]">Select a document to review</p></div></div><div className="mt-5 space-y-2">{documents.map(document => <button key={document.id} onClick={() => setSelectedDocument(document)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${selectedDocument.id === document.id ? "border-[#d7b66d]/50 bg-[#d7b66d]/10" : "border-white/8 hover:bg-white/5"}`}><span><span className="block text-sm font-medium">{document.title}</span><span className="text-xs text-[#aaa194]">{document.type}</span></span><Eye className="h-4 w-4 text-[#d7b66d]" /></button>)}</div></CardContent></Card><Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-[#d7b66d]">Document review</p><h2 className="mt-2 text-xl font-semibold">{selectedDocument.title}</h2><p className="mt-1 text-sm text-[#aaa194]">{selectedDocument.type}</p></div><Button size="sm" variant="outline" onClick={() => setUploadMessage(`${selectedDocument.title} is ready for download in the full API demo.`)}><Download className="mr-2 h-4 w-4" />Review</Button></div><div className="mt-6 rounded-xl border border-white/8 bg-black/20 p-5 text-sm leading-7 text-[#d6cdbf]"><p>{selectedDocument.text}</p></div><p className="mt-4 text-xs text-[#77716a]">Demo document preview. In the full API build this panel will open the stored generated file.</p></CardContent></Card></section>
        <p className="mt-8 text-center text-xs text-[#77716a]">Browser demo mode: PDF upload, matched jobs, and document review are available without sending files to a server. Real AI processing and persistent storage require the full API.</p>
      </div>
    </main>
  );
}
function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) { return <Card className="border-[#d7b66d]/15 bg-[#111112]"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-[#bdb4a5]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div><span className="jo-gold-text">{icon}</span></div><p className="mt-3 text-xs text-[#9e9689]">{detail}</p></CardContent></Card>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3"><span className="text-[#aaa194]">{label}</span><span className="text-right font-medium text-[#e7ded0]">{value}</span></div>; }
