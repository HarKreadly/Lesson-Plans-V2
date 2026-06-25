import React from "react";
import { CheckCircle2, UploadCloud, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function InstructionsView() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start px-6 py-12 md:py-24 animate-fade-in bg-transparent select-none">
      <div className="w-full max-w-xl mx-auto flex flex-col">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-600 mb-14 text-center">
          Instructions
        </h1>

        {/* Minimalist guide list strictly relying on text, lines, and clean zinc typography */}
        <div className="space-y-12">
          
          {/* Step 1: Upload */}
          <div className="flex gap-6 items-start relative opacity-95">
            <div className="flex flex-col items-center h-full">
              <div className="w-9 h-9 flex items-center justify-center shrink-0 text-zinc-800">
                <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="w-px h-16 bg-zinc-200/80 mt-3" />
            </div>
            <div className="flex-1 pt-1.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-3 bg-clip-text">
                1. Upload Target Lessons
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                First, find the target lesson required of you on the cards set under the{" "}
                <Link to="/upload" className="font-semibold text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                  Upload
                </Link>{" "}
                tab (for example, <span className="font-semibold text-zinc-900">Spotlight 2 • Unit 3 • Lesson 4</span>) and proceed to upload it.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2.5">
                Once high-quality target materials are complete, you can add different variations for the same lesson (naming them{" "}
                <span className="font-mono text-[10px] text-zinc-700 bg-zinc-100/90 px-1.5 py-0.5 rounded border border-zinc-200">V1</span>,{" "}
                <span className="font-mono text-[10px] text-zinc-700 bg-zinc-100/90 px-1.5 py-0.5 rounded border border-zinc-200">V2</span>, or{" "}
                <span className="font-mono text-[10px] text-zinc-700 bg-zinc-100/90 px-1.5 py-0.5 rounded border border-zinc-200">V3</span>) or contribute other lessons different than the assigned one. All assets store instantly on our database.
              </p>
            </div>
          </div>

          {/* Step 2: Completed */}
          <div className="flex gap-6 items-start relative opacity-95">
            <div className="flex flex-col items-center h-full">
              <div className="w-9 h-9 flex items-center justify-center shrink-0 text-zinc-800">
                <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="w-px h-16 bg-zinc-200/80 mt-3" />
            </div>
            <div className="flex-1 pt-1.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-3">
                2. Confirm Accomplishments
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                Browse the{" "}
                <Link to="/completed" className="font-semibold text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                  Completed
                </Link>{" "}
                tab to verify your finished lesson plans. These listings showcase the completed assignment details together with a badge highlighting your exact contribution file counts.
              </p>
            </div>
          </div>

          {/* Step 3: Documents */}
          <div className="flex gap-6 items-start opacity-95">
            <div className="flex flex-col items-center h-full">
              <div className="w-9 h-9 flex items-center justify-center shrink-0 text-zinc-800">
                <FileText className="w-5 h-5" strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex-1 pt-1.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-3">
                3. Access the Document Archive
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Go to the{" "}
                <Link to="/documents" className="font-semibold text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                  Documents
                </Link>{" "}
                tab to explore all compiled course materials. We retrieve everything cleanly so instructors can view or download documents on demand.
              </p>
            </div>
          </div>

        </div>

        {/* Start button centered */}
        <div className="mt-16 pt-8 border-t border-zinc-200/80 flex justify-center">
          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm group"
          >
            Start Uploading
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </Link>
        </div>

      </div>
    </div>
  );
}
