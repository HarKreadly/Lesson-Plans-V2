import React, { useMemo } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { curriculum } from "../data/curriculum";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  Award,
  Clock,
  BarChart2,
  CheckCircle2,
} from "lucide-react";

// Animated number
function AnimatedNumber({ value, className }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {value}
    </motion.span>
  );
}

// Relative time helper
function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Stat card — pure zinc
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-start gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
        <AnimatedNumber
          value={value}
          className="block text-3xl font-black font-mono mt-0.5 text-zinc-800"
        />
        {sub && <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// Thin progress bar — zinc only
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="relative w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full bg-zinc-400"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

export function CompletedView() {
  const { teachers, isLoading, error } = useTeachers();

  const analytics = useMemo(() => {
    if (!teachers.length) return null;

    const uploaded = teachers.filter((t) => t.hasUploaded);
    const totalFiles = teachers.reduce((a, t) => a + (t.versions?.length || 0), 0);

    // Total lessons across the whole curriculum
    let totalLessons = 0;
    Object.values(curriculum).forEach((units) =>
      Object.values(units).forEach((lessons) => {
        totalLessons += lessons.length;
      })
    );

    // Unique lesson+book combos that have at least one upload
    const coveredSet = new Set(
      uploaded.map((t) => `${t.book}||${t.unit}||${t.lesson}`)
    );
    const coveragePct = Math.round((coveredSet.size / totalLessons) * 100);

    // Leaderboard
    const teacherMap = {};
    teachers.forEach((t) => {
      const name = t.name || "Unknown";
      if (!teacherMap[name]) teacherMap[name] = { name, files: 0, lessons: 0 };
      teacherMap[name].lessons += t.hasUploaded ? 1 : 0;
      teacherMap[name].files += t.versions?.length || 0;
    });
    const leaderboard = Object.values(teacherMap)
      .filter((e) => e.files > 0)
      .sort((a, b) => b.files - a.files);

    // Progress by book
    const bookStats = Object.entries(curriculum).map(([book, units]) => {
      let bookTotal = 0;
      let bookDone = 0;
      Object.entries(units).forEach(([unit, lessons]) => {
        lessons.forEach((lesson) => {
          bookTotal++;
          if (coveredSet.has(`${book}||${unit}||${lesson}`)) bookDone++;
        });
      });
      return { book, done: bookDone, total: bookTotal };
    });

    // Recent uploads
    const allVersions = [];
    teachers.forEach((t) => {
      (t.versions || []).forEach((v) => {
        allVersions.push({ ...v, teacherName: t.name, book: t.book });
      });
    });
    const recent = allVersions
      .filter((v) => v.uploadedAt)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, 10);

    const contributingTeachers = new Set(uploaded.map((t) => t.name)).size;

    return {
      uploaded: uploaded.length,
      total: teachers.length,
      totalFiles,
      coveragePct,
      coveredLessons: coveredSet.size,
      totalLessons,
      leaderboard,
      bookStats,
      recent,
      contributingTeachers,
    };
  }, [teachers]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="w-7 h-7 rounded-full border-2 border-zinc-200 border-t-zinc-700 animate-spin mb-4" />
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
          Loading analytics...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 font-mono text-xs uppercase tracking-widest">
        Error loading data
      </div>
    );
  }

  const a = analytics;

  return (
    <div className="w-full flex-1 flex flex-col animate-fade-in pb-16">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="w-full border-b border-zinc-200/60 bg-white/40 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-baseline gap-4">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-zinc-800">
            Analytics
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 py-10 space-y-10">
        {a && (
          <>
            {/* ── Stat Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={CheckCircle2}
                label="Lessons Uploaded"
                value={a.uploaded}
                sub={`of ${a.total} assigned`}
              />
              <StatCard
                icon={FileText}
                label="Total Files"
                value={a.totalFiles}
                sub="across all versions"
              />
              <StatCard
                icon={Users}
                label="Contributors"
                value={a.contributingTeachers}
                sub="active teachers"
              />
              <StatCard
                icon={TrendingUp}
                label="Coverage"
                value={`${a.coveragePct}%`}
                sub={`${a.coveredLessons} of ${a.totalLessons} lessons`}
              />
            </div>

            {/* ── Overall Progress ───────────────────────────────── */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Overall Completion
                  </p>
                  <p className="text-sm font-semibold text-zinc-700">
                    {a.uploaded} uploaded · {a.total - a.uploaded} pending
                  </p>
                </div>
                <span className="text-3xl font-black font-mono text-zinc-800">
                  {a.total > 0 ? Math.round((a.uploaded / a.total) * 100) : 0}%
                </span>
              </div>
              <ProgressBar value={a.uploaded} max={a.total} />
            </div>

            {/* ── Leaderboard + Book Progress ────────────────────── */}
            <div className="space-y-6">

              {/* Leaderboard */}
              <div className="bg-white border border-zinc-200/80 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    Teacher Leaderboard
                  </h2>
                  <span className="ml-auto text-[9px] font-mono text-zinc-400">
                    {a.leaderboard.length} contributors
                  </span>
                </div>

                <div className="divide-y divide-zinc-50 max-h-[440px] overflow-y-auto">
                  {a.leaderboard.length === 0 ? (
                    <div className="px-5 py-10 text-center text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                      No contributions yet
                    </div>
                  ) : (
                    a.leaderboard.map((entry, i) => (
                      <motion.div
                        key={entry.name}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/60 transition-colors"
                      >
                        {/* Rank number */}
                        <span className="w-5 text-[10px] font-black font-mono text-zinc-400 shrink-0 text-center">
                          {i + 1}
                        </span>

                        {/* Initials avatar */}
                        <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-black text-zinc-600 uppercase">
                            {entry.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>

                        {/* Name + lesson count */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-800 truncate">{entry.name}</p>
                          <p className="text-[9px] text-zinc-400 font-medium">
                            {entry.lessons} {entry.lessons === 1 ? "lesson" : "lessons"}
                          </p>
                        </div>

                        {/* File count */}
                        <div className="text-right shrink-0 mr-2">
                          <p className="text-sm font-black font-mono text-zinc-800">{entry.files}</p>
                          <p className="text-[8px] text-zinc-400 uppercase tracking-wider">files</p>
                        </div>

                        {/* Mini bar */}
                        <div className="w-14 shrink-0">
                          <ProgressBar
                            value={entry.files}
                            max={a.leaderboard[0]?.files || 1}
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Progress by Book */}
              <div className="bg-white border border-zinc-200/80 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    Progress by Textbook
                  </h2>
                </div>

                <div className="p-6 space-y-7">
                  {a.bookStats.map(({ book, done, total }, i) => {
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <motion.div
                        key={book}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-bold text-zinc-800">{book}</p>
                            <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                              {done} of {total} lessons covered
                            </p>
                          </div>
                          <span className="text-xl font-black font-mono text-zinc-700">{pct}%</span>
                        </div>
                        <ProgressBar value={done} max={total} />
                      </motion.div>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-100 px-6 py-4 grid grid-cols-3 divide-x divide-zinc-100">
                  {a.bookStats.map(({ book, done, total }) => (
                    <div key={book} className="text-center px-3">
                      <p className="text-xl font-black font-mono text-zinc-800">{done}</p>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold leading-tight mt-0.5">
                        {book.replace("Spotlight ", "SP")}
                      </p>
                      <p className="text-[8px] text-zinc-300 font-medium">/{total}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Recent Uploads ─────────────────────────────────── */}
            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Recent Uploads
                </h2>
                <span className="ml-auto text-[9px] font-mono text-zinc-400">
                  Last {a.recent.length}
                </span>
              </div>

              {a.recent.length === 0 ? (
                <div className="px-5 py-10 text-center text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                  No uploads yet
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {a.recent.map((v, i) => (
                    <motion.div
                      key={v.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-800 truncate">
                          {v.name || "Document"}
                        </p>
                        <p className="text-[9px] text-zinc-400 font-medium truncate">
                          {v.teacherName} · {v.book}
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 shrink-0">
                        {timeAgo(v.uploadedAt)}
                      </span>
                      {v.fileLink && (
                        <a
                          href={v.fileLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 px-2.5 py-1 rounded-md transition-all shrink-0"
                        >
                          View
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!a && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <BarChart2 className="w-8 h-8 text-zinc-200 mb-4" strokeWidth={1} />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              No data available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
