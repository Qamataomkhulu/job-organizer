import { Fragment } from "react";

function InlineText({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>)}</>;
}

export function MarkdownDocument({ content, compact = false }: { content: string; compact?: boolean }) {
  return <div className={compact ? "space-y-3 text-sm leading-6" : "space-y-4 text-[15px] leading-7"}>{content.split("\n").map((line, index) => {
    if (!line.trim()) return <div key={index} className="h-1" />;
    if (line.startsWith("### ")) return <h3 key={index} className="pt-2 text-base font-semibold tracking-tight text-[#eee3d4]"><InlineText value={line.slice(4)} /></h3>;
    if (line.startsWith("## ")) return <h2 key={index} className="pt-4 text-xl font-semibold tracking-tight text-[#f5eee3]"><InlineText value={line.slice(3)} /></h2>;
    if (line.startsWith("# ")) return <h1 key={index} className="text-2xl font-semibold tracking-[-0.03em] text-[#f5eee3]"><InlineText value={line.slice(2)} /></h1>;
    if (line.startsWith("- ")) return <div key={index} className="flex gap-3 text-[#c9c0b3]"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#70c8bc]" /><span><InlineText value={line.slice(2)} /></span></div>;
    if (line.startsWith("> ")) return <blockquote key={index} className="border-l-2 border-[#70c8bc] pl-4 text-[#c9c0b3]"><InlineText value={line.slice(2)} /></blockquote>;
    return <p key={index} className="text-[#c9c0b3]"><InlineText value={line} /></p>;
  })}</div>;
}
