import { findQuoteRange } from "../highlight";
import type { ReactNode } from "react";

// Renders a corpus document as a realistic paper artifact (letterhead / clinical
// record / policy) while preserving the EXACT citation highlight. The highlight
// range is computed on the raw markdown string (see findQuoteRange), and every
// text run is rendered with awareness of its raw-string offset, so the cited
// passage is wrapped in <mark> even when it spans a **bold** boundary. Same text,
// same match — only the presentation changes.

type Range = [number, number] | null;

const DOC_CHROME: Record<string, { band: string; label: string; accent: string }> = {
  denial_letter: { band: "bg-rose-700", label: "Notice of Adverse Benefit Determination", accent: "text-rose-700" },
  policy: { band: "bg-indigo-700", label: "Medical Policy", accent: "text-indigo-700" },
  chart: { band: "bg-teal-700", label: "Clinical Record · Confidential", accent: "text-teal-700" },
  pt_notes: { band: "bg-teal-700", label: "Therapy Record · Confidential", accent: "text-teal-700" },
  radiology_log: { band: "bg-teal-700", label: "Imaging History · Confidential", accent: "text-teal-700" },
};

interface State {
  key: number;
  firstMarkAssigned: boolean;
}

function markRun(text: string, runStart: number, range: Range, bold: boolean, italic: boolean, st: State): ReactNode {
  const wrap = (node: ReactNode) => {
    let n = node;
    if (italic) n = <em key={st.key++}>{n}</em>;
    if (bold) n = <strong key={st.key++}>{n}</strong>;
    return bold || italic ? n : <span key={st.key++}>{n}</span>;
  };
  if (!range) return wrap(text);
  const [s, e] = range;
  const runEnd = runStart + text.length;
  if (runEnd <= s || runStart >= e) return wrap(text); // no overlap
  const a = Math.max(0, s - runStart);
  const b = Math.min(text.length, e - runStart);
  const before = text.slice(0, a);
  const hit = text.slice(a, b);
  const after = text.slice(b);
  const isFirst = !st.firstMarkAssigned;
  st.firstMarkAssigned = true;
  const mark = (
    <mark
      key={st.key++}
      id={isFirst ? "cited-mark" : undefined}
      className="rounded bg-yellow-200 px-0.5 text-slate-900 ring-1 ring-yellow-400"
    >
      {hit}
    </mark>
  );
  return wrap(
    <>
      {before}
      {mark}
      {after}
    </>
  );
}

// Inline renderer: parses **bold** while tracking each run's raw offset.
function inline(line: string, lineStart: number, range: Range, st: State): ReactNode[] {
  const nodes: ReactNode[] = [];
  let i = 0;
  let bold = false;
  let italic = false;
  let buf = "";
  let bufStart = lineStart;
  const flush = () => {
    if (buf) {
      nodes.push(markRun(buf, bufStart, range, bold, italic, st));
      buf = "";
    }
  };
  while (i < line.length) {
    if (line[i] === "*" && line[i + 1] === "*") {
      flush();
      bold = !bold;
      i += 2;
      bufStart = lineStart + i;
    } else if (line[i] === "*") {
      flush();
      italic = !italic;
      i += 1;
      bufStart = lineStart + i;
    } else {
      if (buf === "") bufStart = lineStart + i;
      buf += line[i];
      i += 1;
    }
  }
  flush();
  return nodes;
}

function renderMarkdown(markdown: string, range: Range): ReactNode[] {
  const lines = markdown.split("\n");
  const offsets: number[] = [];
  let off = 0;
  for (const l of lines) {
    offsets.push(off);
    off += l.length + 1;
  }

  const blocks: ReactNode[] = [];
  const st: State = { key: 0, firstMarkAssigned: false };
  let bi = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = offsets[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("<!--")) continue; // hide the synthetic banner
    if (trimmed === "") continue;

    // Table: consecutive lines starting with "|"
    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        const cells = lines[j].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "")) rows.push(cells);
        j++;
      }
      i = j - 1;
      if (rows.length) {
        blocks.push(
          <table key={bi++} className="my-3 w-full border-collapse text-[13px]">
            <tbody>
              {rows.map((cells, ri) => (
                <tr key={ri} className="border-b border-slate-300 last:border-0">
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`border-r border-slate-200 px-2.5 py-1.5 last:border-0 ${
                        ri === 0 ? "font-semibold text-slate-800" : "text-slate-700"
                      }`}
                    >
                      {cell.replace(/\*\*/g, "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push(<hr key={bi++} className="my-4 border-slate-300" />);
      continue;
    }

    // Blockquote (denial reason)
    if (trimmed.startsWith(">")) {
      const contentOffset = lineStart + (line.indexOf(">") + 1) + (line[line.indexOf(">") + 1] === " " ? 1 : 0);
      const content = line.replace(/^\s*>\s?/, "");
      blocks.push(
        <blockquote key={bi++} className="my-3 border-l-4 border-rose-400 bg-rose-50 px-4 py-2 italic text-slate-700">
          {inline(content, contentOffset, range, st)}
        </blockquote>
      );
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,3})(\s+)(.*)$/);
    if (h) {
      const contentOffset = lineStart + h[1].length + h[2].length;
      const nodes = inline(h[3], contentOffset, range, st);
      if (h[1].length === 1)
        blocks.push(
          <h1 key={bi++} className="mb-1 text-lg font-bold text-slate-900">
            {nodes}
          </h1>
        );
      else if (h[1].length === 2)
        blocks.push(
          <h2 key={bi++} className="mb-1.5 mt-5 border-b border-slate-300 pb-1 text-[13px] font-bold uppercase tracking-wide text-slate-700">
            {nodes}
          </h2>
        );
      else
        blocks.push(
          <h3 key={bi++} className="mb-1 mt-3 text-[13px] font-semibold text-slate-800">
            {nodes}
          </h3>
        );
      continue;
    }

    // List item
    if (/^[-*]\s+/.test(trimmed)) {
      const idx = line.search(/[-*]\s+/);
      const contentOffset = lineStart + idx + 2;
      const content = line.replace(/^\s*[-*]\s+/, "");
      blocks.push(
        <div key={bi++} className="ml-4 flex gap-2 text-[13px] text-slate-700">
          <span className="text-slate-400">•</span>
          <span>{inline(content, contentOffset, range, st)}</span>
        </div>
      );
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={bi++} className="my-1.5 text-[13px] leading-relaxed text-slate-700">
        {inline(line, lineStart, range, st)}
      </p>
    );
  }

  return blocks;
}

interface Props {
  docType: string;
  markdown: string;
  quote: string;
}

export default function DocumentArtifact({ docType, markdown, quote }: Props) {
  const chrome = DOC_CHROME[docType] ?? { band: "bg-slate-600", label: "Document", accent: "text-slate-700" };
  const range = findQuoteRange(markdown, quote);
  const body = renderMarkdown(markdown, range);

  return (
    <div className="overflow-hidden rounded-lg bg-[#faf9f6] shadow-xl ring-1 ring-slate-300">
      <div className={`flex items-center justify-between px-5 py-1.5 ${chrome.band}`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/90">{chrome.label}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/70">Synthetic · demo</span>
      </div>
      <div className="px-6 py-5 font-serif">{body}</div>
    </div>
  );
}
