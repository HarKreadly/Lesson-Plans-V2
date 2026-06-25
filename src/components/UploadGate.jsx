import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { UploadCloud, Lock, ArrowRight, BookOpen, CheckCircle2, FileText } from "lucide-react";

const features = [
  {
    icon: UploadCloud,
    title: "Upload Lesson Plans",
    desc: "Securely upload your documents for any Spotlight lesson.",
  },
  {
    icon: FileText,
    title: "Manage Your Submissions",
    desc: "View, edit, and add versions to lesson plans you've submitted.",
  },
  {
    icon: CheckCircle2,
    title: "Track Your Progress",
    desc: "See all your contributions and their upload status at a glance.",
  },
];

export function UploadGate() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-6 py-16 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg mx-auto"
      >
        {/* Lock icon + badge */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-[0_8px_32px_rgba(9,9,11,0.15)]">
              <BookOpen className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
              <Lock className="w-3 h-3 text-amber-900" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-800 text-center leading-none mb-3">
            Teacher Portal
          </h1>
          <p className="text-sm text-zinc-500 text-center max-w-xs leading-relaxed">
            Sign in or create an account to upload and manage your lesson plans.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3 mb-10">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              className="flex items-start gap-4 bg-white/70 border border-zinc-200/70 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-3"
        >
          <Link
            to="/login?mode=signup"
            id="upload-gate-signup-btn"
            className="flex-none inline-flex items-center justify-center gap-2 px-10 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(9,9,11,0.15)] group"
          >
            Account
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </Link>
        </motion.div>

        <p className="text-center text-[10px] text-zinc-400 mt-6">
          Only teachers with assigned lesson plans should register.
        </p>
      </motion.div>
    </div>
  );
}
