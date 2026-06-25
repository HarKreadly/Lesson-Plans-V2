import { useState, useRef, useEffect } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { curriculum } from "../data/curriculum";
import { motion, AnimatePresence } from "motion/react";
import defaultJsonConfig from "../../firebase-applet-config.json";
import {
  Lock,
  Plus,
  Trash2,
  Database,
  Check,
  ChevronDown,
  Loader2,
  X,
  Search,
  BookOpen,
  User,
  GraduationCap,
  Upload,
  AlertTriangle,
} from "lucide-react";

// Minimalist progressive steps of genuine Zinc color matching the modern Swiss aesthetic
const SHADES = [
  { from: "#fafafa", to: "#f5f5f7" }, 
  { from: "#f5f5f7", to: "#f0f0f2" }, 
  { from: "#f0f0f2", to: "#ebebef" }, 
  { from: "#ebebef", to: "#e4e4e7" }, 
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const staggerItem = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 18,
    },
  },
};

// Custom Reusable Premium Dropdown
function CustomSelect({ value, onChange, options, showAllOption = false, allLabel = "All", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative w-full transition-all ${isOpen && !disabled ? "z-50" : "z-10"} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none grayscale" : ""}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-md py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-650 transition-all outline-none"
      >
        <span className="truncate">
          {value ? value : allLabel}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 right-0 z-[100] mt-1 max-h-56 overflow-y-auto bg-white border border-zinc-200/80 shadow-[0_8px_24px_rgba(9,9,11,0.06)] rounded-md py-1 text-[10px]"
          >
            {showAllOption && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 font-bold uppercase tracking-wider transition-colors hover:bg-zinc-50 cursor-pointer ${
                  !value ? "text-zinc-700 bg-zinc-50" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {allLabel}
              </button>
            )}
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 font-bold uppercase tracking-wider transition-colors hover:bg-zinc-50 cursor-pointer ${
                  value === option ? "text-zinc-700 bg-zinc-50" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminView() {
  const { teachers, updateTeacher, createTeacher, bulkCreateTeachers, deleteTeacher, seedMockData, isLoading, error } = useTeachers();
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Search/filter in assignment list inside admin view
  const [adminSearch, setAdminSearch] = useState("");

  // States for creating a real teacher/lesson assignment
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newBook, setNewBook] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newLesson, setNewLesson] = useState("");
  const [newGroup, setNewGroup] = useState("Group 1");
  
  const [adminSuccess, setAdminSuccess] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  const [importingFile, setImportingFile] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const fileInputRef = useRef(null);

  // Check if authorized in sessionStorage on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authorized_lesson_plans");
    if (authStatus === "true") {
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
    if (password === correctPassword) {
      sessionStorage.setItem("admin_authorized_lesson_plans", "true");
      setIsAuthorized(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect password.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authorized_lesson_plans");
    setIsAuthorized(false);
    setPassword("");
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setImportingFile(true);

    try {
      const text = await file.text();
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      let parsed = [];
      if (fileExt === "json" || text.trim().startsWith("[")) {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            parsed = data;
          } else {
            throw new Error("JSON file must contain an array of assignments.");
          }
        } catch (je) {
          throw new Error("Failed to parse JSON file: " + je.message);
        }
      } else {
        // Parse CSV/TXT
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length > 0) {
          const firstLine = lines[0].toLowerCase();
          const delimiter = firstLine.includes(";") ? ";" : ",";
          let headers = null;
          let startIndex = 0;

          if (firstLine.includes("name") || firstLine.includes("book") || firstLine.includes("unit") || firstLine.includes("lesson") || firstLine.includes("teacher")) {
            headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
            startIndex = 1;
          }

          for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(delimiter).map(p => p.replace(/^["']|["']$/g, "").trim());
            if (parts.length >= 2) {
              let name = "", book = "Spotlight 1", unit = "", lesson = "", group = "Group 1";
              if (headers) {
                const nameIdx = headers.indexOf("name") !== -1 ? headers.indexOf("name") : headers.indexOf("teacher");
                const bookIdx = headers.indexOf("book") !== -1 ? headers.indexOf("book") : headers.indexOf("curriculum");
                const unitIdx = headers.indexOf("unit");
                const lessonIdx = headers.indexOf("lesson");
                const groupIdx = headers.indexOf("group");

                if (nameIdx !== -1 && parts[nameIdx]) name = parts[nameIdx];
                if (bookIdx !== -1 && parts[bookIdx]) book = parts[bookIdx];
                if (unitIdx !== -1 && parts[unitIdx]) unit = parts[unitIdx];
                if (lessonIdx !== -1 && parts[lessonIdx]) lesson = parts[lessonIdx];
                if (groupIdx !== -1 && parts[groupIdx]) group = parts[groupIdx];
              } else {
                name = parts[0] || "";
                book = parts[1] || "Spotlight 1";
                unit = parts[2] || "";
                lesson = parts[3] || "";
                group = parts[4] || "Group 1";
              }

              if (name.trim()) {
                parsed.push({ name, book, unit, lesson, group });
              }
            }
          }
        }
      }

      const validated = parsed.map(item => {
        const name = (item.name || item.Teacher || item.teacher || "").toString().trim();
        let rawBook = (item.book || item.Book || item.curriculum || "Spotlight 1").toString().trim();
        const unit = (item.unit || item.Unit || "").toString().trim();
        const lesson = (item.lesson || item.Lesson || "").toString().trim();
        const group = (item.group || item.Group || "Group 1").toString().trim();

        // Normalize Spotlight book names (case-insensitive checks)
        let book = "Spotlight 1";
        if (/spotlight\s*1/i.test(rawBook)) book = "Spotlight 1";
        else if (/spotlight\s*2/i.test(rawBook)) book = "Spotlight 2";
        else if (/spotlight\s*3/i.test(rawBook)) book = "Spotlight 3";
        else book = rawBook || "Spotlight 1";

        return { name, book, unit, lesson, group };
      }).filter(item => item.name.length > 0);

      if (validated.length === 0) {
        throw new Error("No valid assignments found in file. Make sure columns/keys map correctly (Name, Book, Unit, Lesson, Group).");
      }

      await bulkCreateTeachers(validated);
      setImportSuccess(`Imported ${validated.length} assignments successfully!`);
      // Reset after a few seconds
      setTimeout(() => setImportSuccess(null), 5000);
    } catch (err) {
      console.error("Bulk import failed:", err);
      setImportError(err.message || "Failed to process file.");
    } finally {
      setImportingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTeacherName.trim()) {
      setAdminError("Please enter a teacher name.");
      return;
    }
    if (!newBook || !newUnit || !newLesson) {
      setAdminError("Please select Book, Unit, and Lesson.");
      return;
    }

    setIsAdminSaving(true);
    setAdminError(null);
    setAdminSuccess(false);

    try {
      const payload = {
        name: newTeacherName.trim(),
        book: newBook,
        unit: newUnit,
        lesson: newLesson,
        group: newGroup,
      };
      await createTeacher(payload);
      setLastCreated(payload);
      setNewTeacherName("");
      setNewBook("");
      setNewUnit("");
      setNewLesson("");
      setNewGroup("Group 1");
      setAdminSuccess(true);
      // Let success notification persist for 6 seconds unless closed
      setTimeout(() => setAdminSuccess(false), 6000);
    } catch (err) {
      setAdminError(err.message || "Failed to create assignment.");
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm("Are you sure you want to clear ALL configurations and lessons from the database? This is permanent.")) return;
    try {
      for (const t of teachers) {
        await deleteTeacher(t.id);
      }
    } catch (err) {
      console.error("Database clear failed:", err);
    }
  };

  const adminBookOptions = Object.keys(curriculum);
  const adminUniqueUnits = newBook ? Object.keys(curriculum[newBook] || {}) : [];
  const adminUniqueLessons = (newBook && newUnit) ? (curriculum[newBook][newUnit] || []) : [];

  const filteredTeachers = teachers.filter((t) => {
    const q = adminSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.book.toLowerCase().includes(q) ||
      t.unit.toLowerCase().includes(q) ||
      t.lesson.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q)
    );
  });

  if (!isAuthorized) {
    return (
      <div className="w-full max-w-md mx-auto my-16 px-6 animate-fade-in">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white border border-zinc-200/80 rounded-lg shadow-sm p-8"
        >
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="p-3 bg-zinc-50 rounded-full border border-zinc-100 mb-3 text-zinc-500">
              <Lock className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
              Admin Access
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Enter password to configure assignments
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-zinc-50/50 border border-zinc-200 hover:border-zinc-300 rounded-md py-1.5 px-3 outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-100 placeholder:text-zinc-300 text-[10px] tracking-wider text-zinc-650"
              />
            </div>

            {loginError && (
              <p className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-wide">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-md transition-all cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="w-full max-w-6xl mx-auto px-6 md:px-8 pb-16 relative"
    >
      {/* Sub Title / Header Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9c9ca3] block mb-1">
            System Operations
          </span>
          <h2 className="text-xl font-bold text-zinc-850 uppercase tracking-tight">
            Administrator Panel
          </h2>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 text-[9px] uppercase font-bold tracking-wider border border-zinc-300/30 transition-all cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50/70 border border-red-100 rounded-lg text-left">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-red-100/50 rounded-full text-red-650 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
                Database Interface Connection Alert
              </h3>
              <p className="text-[11px] text-red-650 leading-relaxed font-sans font-medium">
                {error}
              </p>
              
              <div className="mt-3 text-[10px] text-zinc-550 space-y-2 leading-relaxed max-w-2xl bg-white/40 border border-red-200/20 rounded p-3">
                <p className="font-semibold text-zinc-700">How to establish your Firebase database:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[9px] text-zinc-500">
                  <li>
                    Verify that a Firestore Database with ID <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-650 font-mono font-bold">ai-studio-05119bef-b4c3-431c-bac8-7f76847e6d22</code> is created in your Firebase project.
                  </li>
                  <li>
                    If the database is not provisioned yet, please go to your <a href={`https://console.firebase.google.com/project/${defaultJsonConfig.projectId}/firestore`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">Firebase Console</a> and initialize standard Firestore Services.
                  </li>
                  <li>
                    Ensure the database is set to <span className="font-bold text-zinc-700">test mode</span> or appropriate rules are deployed. Use the <strong className="text-zinc-700">"Wipe All Database Entries"</strong> button inside this panel first to see if client connections reset successfully, or click on <strong className="text-zinc-700">"Load 160 Sample Items"</strong> below.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Form & Database actions */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div variants={staggerItem} className="bg-white border border-zinc-200/80 rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800 mb-4 pb-2 border-b border-zinc-100">
              Create New Assignment
            </h3>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              {/* Teacher Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Teacher Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Mary Johnson"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-md py-1.5 px-3 outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-100 placeholder:text-zinc-300 text-[10px] uppercase font-bold tracking-wider text-zinc-650"
                />
              </div>

              {/* Group Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Group</label>
                <CustomSelect
                  value={newGroup}
                  onChange={setNewGroup}
                  options={["Group 1", "Group 2", "Group 3", "Group 4"]}
                  showAllOption={false}
                />
              </div>

              {/* Book Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Book</label>
                <CustomSelect
                  value={newBook}
                  onChange={(val) => {
                    setNewBook(val);
                    setNewUnit("");
                    setNewLesson("");
                  }}
                  options={adminBookOptions}
                  showAllOption={false}
                />
              </div>

              {/* Unit Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Unit</label>
                <CustomSelect
                  value={newUnit}
                  onChange={(val) => {
                    setNewUnit(val);
                    setNewLesson("");
                  }}
                  options={adminUniqueUnits}
                  showAllOption={false}
                  disabled={!newBook}
                />
              </div>

              {/* Lesson Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Lesson</label>
                <CustomSelect
                  value={newLesson}
                  onChange={setNewLesson}
                  options={adminUniqueLessons}
                  showAllOption={false}
                  disabled={!newUnit}
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isAdminSaving}
                  className="w-full justify-center px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAdminSaving ? "Creating..." : "Create Assignment"}</span>
                </button>
              </div>

              {adminError && (
                <p className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-wide text-center pt-1">
                  {adminError}
                </p>
              )}

              {adminSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-emerald-50/70 border border-emerald-100 rounded-md p-2.5 flex items-start gap-2 overflow-hidden mt-3"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                      Created Successfully
                    </p>
                    <p className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest mt-0.5">
                      Synced on live database
                    </p>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>

          <motion.div variants={staggerItem} className="bg-white border border-zinc-200/80 rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800 mb-4 pb-2 border-b border-zinc-100">
              Database Controls
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={seedMockData}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-650 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Database className="w-4 h-4 text-zinc-400" />
                <span>Load 160 Sample Items</span>
              </button>
              <p className="text-[9px] text-zinc-400 text-center leading-relaxed px-1 mt-1">
                Generates a realistic test dataset featuring the official Spotlight curriculum, including 25% completed submissions with multi-version contributions & document archives.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || importingFile}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-650 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {importingFile ? (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-zinc-400" />
                )}
                <span>Import CSV / JSON File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleBulkImport}
                accept=".csv,.json,.txt"
                className="hidden"
              />

              <button
                type="button"
                onClick={handleClearDatabase}
                disabled={isLoading || teachers.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider text-red-650 bg-red-50 hover:bg-red-100/80 border border-red-200/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Wipe All Database Entries</span>
              </button>
              
              {importError && (
                <div className="bg-red-50 text-[9px] font-mono font-bold uppercase tracking-wider text-red-500 p-2 text-center rounded border border-red-100">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="bg-emerald-50 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 p-2 text-center rounded border border-emerald-100">
                  {importSuccess}
                </div>
              )}

              <div className="text-[9px] font-mono text-zinc-400 text-center uppercase tracking-wider pt-2">
                Total active assignments: {teachers.length}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: master list of teachers */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div variants={staggerItem} className="bg-white border border-zinc-200/80 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800">
                School Assignment List ({filteredTeachers.length} entries)
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search database..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-300 rounded-md py-1.5 pl-9 pr-4 outline-none text-[10px] tracking-wide text-zinc-650 placeholder:text-zinc-300"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                  Synching database...
                </span>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-200 rounded text-zinc-400">
                <Database className="w-8 h-8 mx-auto mb-2 text-zinc-300" strokeWidth={1} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                  No records found
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded border border-zinc-200/65">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-400">
                      <th className="py-3 px-4">Teacher Name</th>
                      <th className="py-3 px-4">Group</th>
                      <th className="py-3 px-4">Assigned Curriculum</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-[10px] text-zinc-600 font-medium">
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-zinc-50/55 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="font-bold text-zinc-800 uppercase tracking-tight">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-400">
                            {teacher.group}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-700 font-bold uppercase tracking-tight text-[9px]">{teacher.book}</span>
                            <span className="text-zinc-400 font-mono text-[8px] uppercase">{teacher.unit} &bull; {teacher.lesson}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            teacher.hasUploaded
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {teacher.hasUploaded ? "Uploaded" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove lesson assignment for ${teacher.name}?`)) {
                                deleteTeacher(teacher.id);
                              }
                            }}
                            className="text-zinc-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer inline-flex items-center"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* Toast notification wrapper */}
      <AnimatePresence>
        {adminSuccess && lastCreated && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-6 right-6 z-[1000] w-full max-w-sm bg-white border border-zinc-200/90 shadow-[0_12px_32px_rgba(9,9,11,0.08)] rounded-lg p-4 font-sans pointer-events-auto"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Assignment Created
                </p>
                <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
                  Logged to database successfully
                </p>
                
                <div className="mt-2.5 pt-2 border-t border-zinc-100 space-y-1 text-[10px] font-medium text-zinc-650">
                  <div className="flex justify-between items-center">
                     <span className="text-zinc-400">Teacher:</span>
                     <span className="font-bold text-zinc-800 uppercase tracking-tight">{lastCreated.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-zinc-400 font-sans">Curriculum:</span>
                     <span className="font-bold text-zinc-700">{lastCreated.book}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-zinc-400 font-sans">Lesson:</span>
                     <span className="font-mono text-[9px] text-zinc-500">{lastCreated.unit} &bull; {lastCreated.lesson}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-zinc-400">Group:</span>
                     <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider">{lastCreated.group}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminSuccess(false)}
                className="text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
