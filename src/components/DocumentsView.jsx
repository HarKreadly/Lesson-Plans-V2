import React, { useState, useMemo, useCallback } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { curriculum } from "../data/curriculum";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ChevronRight,
  BookOpen,
  Layers,
  FileText,
  Eye,
  Download,
  FolderOpen,
  ChevronsDownUp,
  ChevronsUpDown,
  X,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(teachers) {
  // Map: book → unit → lesson → [version docs]
  const tree = {};
  teachers.forEach((t) => {
    if (!t.hasUploaded && !(t.versions?.length > 0)) return;
    const book = t.book;
    const unit = t.unit;
    const lesson = t.lesson;
    if (!book || !unit || !lesson) return;

    if (!tree[book]) tree[book] = {};
    if (!tree[book][unit]) tree[book][unit] = {};
    if (!tree[book][unit][lesson]) tree[book][unit][lesson] = [];

    if (t.versions && t.versions.length > 0) {
      t.versions.forEach((v) => {
        tree[book][unit][lesson].push({ ...v, teacherName: t.name });
      });
    } else if (t.fileLink) {
      tree[book][unit][lesson].push({
        id: t.id + "_legacy",
        name: "Document",
        fileLink: t.fileLink,
        teacherName: t.name,
        uploadedAt: t.updatedAt,
      });
    }
  });
  return tree;
}

function matchesSearch(str, q) {
  return str?.toLowerCase().includes(q.toLowerCase());
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              Document Preview
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 w-full bg-zinc-100/50">
          {/* Use iframe to preview Firebase storage URLs. Note: some file types may download automatically based on browser settings */}
          <iframe src={url} className="w-full h-full border-none" title="Preview" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VersionRow({ version, highlight, onPreview }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 pl-14 pr-4 py-2.5 hover:bg-zinc-50/80 transition-colors group ${
        highlight ? "bg-amber-50/40" : ""
      }`}
    >
      <span className="text-zinc-200 font-mono text-[10px] select-none shrink-0">└─</span>
      <div className="w-6 h-6 bg-zinc-100 rounded-md flex items-center justify-center shrink-0">
        <FileText className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-zinc-700 truncate">{version.name || "Document"}</p>
        {version.teacherName && (
          <p className="text-[9px] text-zinc-400 font-medium">by {version.teacherName}</p>
        )}
      </div>
      {version.fileLink ? (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPreview(version.fileLink)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-800 hover:border-zinc-300 transition-all"
          >
            View
            <Eye className="w-2.5 h-2.5" />
          </button>
          <a
            href={version.fileLink}
            target="_blank"
            download
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-800 hover:border-zinc-300 transition-all"
          >
            Download
            <Download className="w-2.5 h-2.5" />
          </a>
        </div>
      ) : (
        <span className="text-[9px] text-zinc-300 italic">No file</span>
      )}
    </motion.div>
  );
}

function LessonRow({ lessonName, versions, isOpen, onToggle, hasMatch, searchTerm, onPreview }) {
  const hasVersions = versions && versions.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-left transition-colors hover:bg-zinc-50/60 ${
          hasMatch && searchTerm ? "bg-amber-50/30" : ""
        }`}
      >
        <span className="text-zinc-200 font-mono text-[10px] select-none shrink-0">└─</span>
        {/* Folder icon */}
        <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${hasVersions ? "text-zinc-500" : "text-zinc-300"}`} strokeWidth={1.5} />
        <span className="flex-1 text-[11px] font-medium text-zinc-600 text-left leading-snug">
          {lessonName}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {hasVersions && (
            <span className="text-[8px] font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-md">
              {versions.length} {versions.length === 1 ? "file" : "files"}
            </span>
          )}
          <ChevronRight
            className={`w-3 h-3 text-zinc-300 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {hasVersions ? (
              versions.map((v, i) => (
                <VersionRow key={v.id || i} version={v} highlight={!!searchTerm} onPreview={onPreview} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 pl-14 pr-4 py-2.5"
              >
                <span className="text-zinc-200 font-mono text-[10px] select-none shrink-0">└─</span>
                <span className="text-[10px] text-zinc-400 italic">Folder empty (No uploads)</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitRow({ unitName, lessonMap, isOpen, onToggle, openLessons, toggleLesson, searchTerm, onPreview }) {
  const totalFiles = Object.values(lessonMap).reduce((a, v) => a + v.length, 0);
  const coveredLessons = Object.values(lessonMap).filter((v) => v.length > 0).length;
  const hasMatch = searchTerm ? matchesSearch(unitName, searchTerm) : false;

  return (
    <div className="border-b border-zinc-50 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-3 pl-6 pr-4 py-3 text-left transition-colors hover:bg-zinc-50/70 ${
          hasMatch && searchTerm ? "bg-amber-50/40" : ""
        }`}
      >
        <span className="text-zinc-200 font-mono text-[10px] select-none shrink-0">└─</span>
        <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-xs font-semibold text-zinc-700 text-left">{unitName}</span>
        <div className="flex items-center gap-2 shrink-0">
          {totalFiles > 0 && (
            <span className="text-[8px] font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded-md">
              {totalFiles} files
            </span>
          )}
          <span className="text-[8px] text-zinc-300 font-medium">
            {coveredLessons}/{Object.keys(lessonMap).length}
          </span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-zinc-300 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-zinc-50"
          >
            {Object.entries(lessonMap).map(([lessonName, versions]) => {
              const lessonKey = `${unitName}||${lessonName}`;
              const lessonMatch = searchTerm
                ? matchesSearch(lessonName, searchTerm) ||
                  versions.some(
                    (v) =>
                      matchesSearch(v.name, searchTerm) ||
                      matchesSearch(v.teacherName, searchTerm)
                  )
                : false;
              return (
                <LessonRow
                  key={lessonName}
                  lessonName={lessonName}
                  versions={versions}
                  isOpen={openLessons.has(lessonKey)}
                  onToggle={() => toggleLesson(lessonKey)}
                  hasMatch={lessonMatch}
                  searchTerm={searchTerm}
                  onPreview={onPreview}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookRow({ bookName, unitMap, isOpen, onToggle, openUnits, toggleUnit, openLessons, toggleLesson, searchTerm, fileCount, onPreview }) {
  const hasMatch = searchTerm ? matchesSearch(bookName, searchTerm) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
    >
      {/* Book header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-50/60 ${
          hasMatch && searchTerm ? "bg-zinc-100/60" : ""
        }`}
      >
        <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-sm font-black uppercase tracking-tight text-zinc-800">{bookName}</span>
        <div className="flex items-center gap-2 shrink-0">
          {fileCount > 0 && (
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md border text-zinc-600 bg-zinc-100 border-zinc-200">
              {fileCount} files
            </span>
          )}
          <span className="text-[9px] text-zinc-400 font-medium">
            {Object.keys(unitMap).length} units
          </span>
          <ChevronRight
            className={`w-4 h-4 text-zinc-300 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-zinc-100"
          >
            {Object.entries(unitMap).map(([unitName, lessonMap]) => {
              const unitKey = `${bookName}||${unitName}`;
              return (
                <UnitRow
                  key={unitName}
                  unitName={unitName}
                  lessonMap={lessonMap}
                  isOpen={openUnits.has(unitKey)}
                  onToggle={() => toggleUnit(unitKey)}
                  openLessons={openLessons}
                  toggleLesson={toggleLesson}
                  searchTerm={searchTerm}
                  onPreview={onPreview}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentsView() {
  const { teachers, isLoading, error } = useTeachers();
  const [searchTerm, setSearchTerm] = useState("");
  const [openBooks, setOpenBooks] = useState(new Set());
  const [openUnits, setOpenUnits] = useState(new Set());
  const [openLessons, setOpenLessons] = useState(new Set());
  
  // State for preview modal
  const [previewUrl, setPreviewUrl] = useState(null);

  // Build the upload tree from Firestore data
  const uploadTree = useMemo(() => buildTree(teachers), [teachers]);

  // Merge curriculum structure with upload data, keeping curriculum order
  const fullTree = useMemo(() => {
    const result = {};
    Object.entries(curriculum).forEach(([book, units]) => {
      result[book] = {};
      Object.entries(units).forEach(([unit, lessons]) => {
        result[book][unit] = {};
        lessons.forEach((lesson) => {
          result[book][unit][lesson] = uploadTree[book]?.[unit]?.[lesson] || [];
        });
      });
    });
    return result;
  }, [uploadTree]);

  // Filter tree by search term
  const visibleTree = useMemo(() => {
    if (!searchTerm.trim()) return fullTree;
    const q = searchTerm.toLowerCase();
    const result = {};
    Object.entries(fullTree).forEach(([book, units]) => {
      const matchBook = book.toLowerCase().includes(q);
      const filteredUnits = {};
      Object.entries(units).forEach(([unit, lessons]) => {
        const matchUnit = unit.toLowerCase().includes(q);
        const filteredLessons = {};
        Object.entries(lessons).forEach(([lesson, versions]) => {
          const matchLesson = lesson.toLowerCase().includes(q);
          const matchVersion = versions.some(
            (v) =>
              v.name?.toLowerCase().includes(q) ||
              v.teacherName?.toLowerCase().includes(q)
          );
          if (matchBook || matchUnit || matchLesson || matchVersion) {
            filteredLessons[lesson] = versions;
          }
        });
        if (matchBook || matchUnit || Object.keys(filteredLessons).length > 0) {
          filteredUnits[unit] = matchBook || matchUnit ? lessons : filteredLessons;
        }
      });
      if (Object.keys(filteredUnits).length > 0) {
        result[book] = filteredUnits;
      }
    });
    return result;
  }, [fullTree, searchTerm]);

  // Auto-expand when searching
  const effectiveOpenBooks = useMemo(() => {
    if (!searchTerm.trim()) return openBooks;
    return new Set(Object.keys(visibleTree));
  }, [searchTerm, visibleTree, openBooks]);

  const effectiveOpenUnits = useMemo(() => {
    if (!searchTerm.trim()) return openUnits;
    const s = new Set();
    Object.entries(visibleTree).forEach(([book, units]) => {
      Object.keys(units).forEach((unit) => s.add(`${book}||${unit}`));
    });
    return s;
  }, [searchTerm, visibleTree, openUnits]);

  const effectiveOpenLessons = useMemo(() => {
    if (!searchTerm.trim()) return openLessons;
    const s = new Set();
    Object.entries(visibleTree).forEach(([book, units]) => {
      Object.entries(units).forEach(([unit, lessons]) => {
        Object.entries(lessons).forEach(([lesson, versions]) => {
          if (versions.length > 0) s.add(`${unit}||${lesson}`);
        });
      });
    });
    return s;
  }, [searchTerm, visibleTree, openLessons]);

  // Toggle helpers
  const toggle = useCallback((setter, key) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const books = new Set(Object.keys(fullTree));
    const units = new Set();
    const lessons = new Set();
    Object.entries(fullTree).forEach(([book, unitMap]) => {
      Object.entries(unitMap).forEach(([unit, lessonMap]) => {
        units.add(`${book}||${unit}`);
        Object.entries(lessonMap).forEach(([lesson]) => {
          lessons.add(`${unit}||${lesson}`);
        });
      });
    });
    setOpenBooks(books);
    setOpenUnits(units);
    setOpenLessons(lessons);
  }, [fullTree]);

  const collapseAll = useCallback(() => {
    setOpenBooks(new Set());
    setOpenUnits(new Set());
    setOpenLessons(new Set());
  }, []);

  const isAllOpen = openBooks.size === Object.keys(fullTree).length;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-800 animate-spin mb-4" />
        <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest">
          Loading Documents...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-red-500 font-mono text-xs uppercase tracking-widest">
        Error loading documents
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col relative animate-fade-in pb-12">
      {/* Preview Modal Overlay */}
      <AnimatePresence>
        {previewUrl && (
          <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="w-full px-8 py-5 select-none shrink-0 border-b border-zinc-200/60 bg-white/40 backdrop-blur-md sticky top-0 z-40 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-zinc-700">
            Curriculum
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Expand / Collapse toggle */}
          {!searchTerm && (
            <button
              onClick={isAllOpen ? collapseAll : expandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 rounded-md transition-all shrink-0"
            >
              {isAllOpen ? (
                <><ChevronsDownUp className="w-3 h-3" /> Collapse</>
              ) : (
                <><ChevronsUpDown className="w-3 h-3" /> Expand All</>
              )}
            </button>
          )}

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              id="documents-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search books, units, lessons..."
              className="w-full appearance-none bg-white hover:bg-zinc-50 border border-zinc-200 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-100 rounded-md py-1.5 pl-9 pr-3 outline-none text-xs text-zinc-700 transition-all placeholder:text-zinc-400 font-medium h-[32px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
          </div>
        </div>
      </div>

      {/* ── Tree ─────────────────────────────────────────────────────── */}
      <div className="p-4 md:p-8 space-y-4">
        {Object.keys(visibleTree).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <FolderOpen className="w-10 h-10 text-zinc-200 mb-4" strokeWidth={1} />
            <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400">
              No matches found for "{searchTerm}"
            </p>
          </div>
        ) : (
          Object.entries(visibleTree).map(([book, unitMap]) => {
            const bookFileCount = Object.values(unitMap).reduce(
              (a, lessons) =>
                a + Object.values(lessons).reduce((b, vers) => b + vers.length, 0),
              0
            );
            return (
              <BookRow
                key={book}
                bookName={book}
                unitMap={unitMap}
                isOpen={effectiveOpenBooks.has(book)}
                onToggle={() => toggle(setOpenBooks, book)}
                openUnits={effectiveOpenUnits}
                toggleUnit={(key) => toggle(setOpenUnits, key)}
                openLessons={effectiveOpenLessons}
                toggleLesson={(key) => toggle(setOpenLessons, key)}
                searchTerm={searchTerm}
                fileCount={bookFileCount}
                onPreview={(url) => setPreviewUrl(url)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
