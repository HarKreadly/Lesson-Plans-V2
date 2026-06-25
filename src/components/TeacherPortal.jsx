import { useState, useRef } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { useAuth } from "../contexts/AuthContext";
import { curriculum } from "../data/curriculum";
import { storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  Check,
  Upload,
  FileText,
  X,
  Paperclip,
  Plus,
  ChevronDown,
  BookOpen,
  Clock,
  ExternalLink,
  User,
  Phone,
  Users,
  Edit,
  AlertCircle,
} from "lucide-react";

function CustomSelect({ value, onChange, options, placeholder = "Select...", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  return (
    <div
      className={`relative w-full ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg py-2.5 px-3 text-sm font-medium text-zinc-700 transition-all outline-none"
      >
        <span className="truncate text-left">{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 ${
                  value === opt ? "text-zinc-900 bg-zinc-50" : "text-zinc-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TeacherPortal() {
  const { user, profile } = useAuth();
  const { teachers, updateTeacher, createTeacher, isLoading, error } = useTeachers({
    filterByUid: user?.uid,
  });

  const [activeModal, setActiveModal] = useState(null);
  const [tempBook, setTempBook] = useState("");
  const [tempUnit, setTempUnit] = useState("");
  const [tempLesson, setTempLesson] = useState("");
  const [tempVersionName, setTempVersionName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [modalError, setModalError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const modalFileRef = useRef(null);

  const openModal = (teacher = null) => {
    const t = teacher || {
      isNew: true,
      name: profile?.displayName || user?.email || "",
      group: profile?.group || "Group 1",
      book: "",
      unit: "",
      lesson: "",
      hasUploaded: false,
      fileLink: null,
      versions: [],
      ownerUid: user?.uid,
    };
    setActiveModal(t);
    setTempBook(t.book || "");
    setTempUnit(t.unit || "");
    setTempLesson(t.lesson || "");
    setTempVersionName("");
    setSelectedFile(null);
    setDragActive(false);
    setIsSaving(false);
    setUploadPercent(0);
    setModalError(null);
    setIsSuccess(false);
    setSuccessInfo(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setIsSuccess(false);
    setSuccessInfo(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tempBook || !tempUnit || !tempLesson) {
      setModalError("Please select Book, Unit, and Lesson.");
      return;
    }
    if (!selectedFile && !activeModal?.fileLink) {
      setModalError("Please upload a lesson plan document.");
      return;
    }

    setIsSaving(true);
    setModalError(null);
    setUploadPercent(0);

    try {
      let downloadURL = activeModal.fileLink || null;
      let newVersions = activeModal.versions ? [...activeModal.versions] : [];

      if (!activeModal.isNew && !activeModal.versions && activeModal.fileLink) {
        newVersions = [{
          id: "v1",
          name: "v1",
          fileLink: activeModal.fileLink,
          uploadedAt: activeModal.updatedAt || Date.now(),
        }];
      }

      if (selectedFile) {
        const isTooLarge = selectedFile.size > 1.5 * 1024 * 1024;
        const teacherId = activeModal.isNew ? `new_${Date.now()}` : activeModal.id;
        const storageRef = ref(storage, `lesson_plans/${teacherId}_${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        try {
          await Promise.race([
            new Promise((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                (snap) => {
                  const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                  setUploadPercent(pct);
                },
                reject,
                async () => {
                  try {
                    downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve();
                  } catch (err) {
                    reject(err);
                  }
                }
              );
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
          ]);
        } catch (storageErr) {
          if (isTooLarge) throw new Error("File too large (max 1.5 MB for fallback). Check your connection.");
          const base64 = await readFileAsDataURL(selectedFile);
          downloadURL = base64;
          setUploadPercent(100);
        }

        const versionName = tempVersionName.trim() || `v${newVersions.length + 1}`;
        newVersions.push({
          id: Date.now().toString(),
          name: versionName,
          book: tempBook,
          unit: tempUnit,
          lesson: tempLesson,
          fileLink: downloadURL,
          uploadedAt: Date.now(),
        });
      }

      if (activeModal.isNew) {
        await createTeacher({
          name: profile?.displayName || user?.email || "Teacher",
          book: tempBook,
          unit: tempUnit,
          lesson: tempLesson,
          group: profile?.group || "Group 1",
          hasUploaded: newVersions.length > 0 || !!downloadURL,
          fileLink: downloadURL,
          versions: newVersions,
          ownerUid: user?.uid,
        });
      } else {
        await updateTeacher(activeModal.id, {
          hasUploaded: newVersions.length > 0 || !!downloadURL,
          fileLink: downloadURL,
          versions: newVersions,
          updatedAt: Date.now(),
        });
      }

      setSuccessInfo({
        book: tempBook,
        unit: tempUnit,
        lesson: tempLesson,
        version: tempVersionName.trim() || `v${newVersions.length}`,
        fileName: selectedFile ? selectedFile.name : "Existing document retained",
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setModalError(err.message || "Failed to upload. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const bookOptions = Object.keys(curriculum);
  const unitOptions = tempBook ? Object.keys(curriculum[tempBook] || {}) : [];
  const lessonOptions = tempBook && tempUnit ? curriculum[tempBook][tempUnit] || [] : [];

  const completedCount = teachers.filter((t) => t.hasUploaded).length;
  const totalVersions = teachers.reduce((acc, t) => acc + (t.versions?.length || 0), 0);

  return (
    <div className="w-full flex-1 flex flex-col animate-fade-in pb-16">
      {/* Page Header */}
      <div className="w-full text-left px-8 py-5 select-none shrink-0 border-b border-zinc-200/60 bg-white/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-zinc-800">
              My Lesson Plans
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5 font-mono uppercase tracking-widest">
              {profile?.displayName ?? user?.email}
              {profile?.group ? ` · ${profile.group}` : ""}
            </p>
          </div>
          <button
            onClick={() => openModal()}
            id="portal-upload-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Lesson Plan
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-8">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: teachers.length, label: "Assignments" },
            { value: completedCount, label: "Uploaded", accent: true },
            { value: totalVersions, label: "Files" },
          ].map(({ value, label, accent }) => (
            <div
              key={label}
              className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-center"
            >
              <p className={`text-3xl font-black font-mono ${accent ? "text-emerald-600" : "text-zinc-800"}`}>
                {value}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Profile info */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-white uppercase">
              {profile?.firstName?.[0] ?? "?"}{profile?.lastName?.[0] ?? ""}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-800">
              {profile?.firstName} {profile?.lastName}
            </p>
            <p className="text-[10px] text-zinc-400 font-medium">{user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.group && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/60">
                <Users className="w-3 h-3" />
                {profile.group}
              </span>
            )}
          </div>
        </div>

        {/* Lesson Plans list */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Lesson Plans
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">{teachers.length} total</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mb-3" />
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              Loading your lessons...
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 rounded-xl bg-white/50">
            <BookOpen className="w-10 h-10 text-zinc-300 mb-4" strokeWidth={1} />
            <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-wide mb-1">
              No lesson plans yet
            </h3>
            <p className="text-xs text-zinc-400 font-medium mb-6 text-center max-w-xs leading-relaxed">
              Upload your first lesson plan by clicking the button above.
            </p>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload First Lesson
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher, idx) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-zinc-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                        teacher.hasUploaded
                          ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                          : "text-amber-600 bg-amber-50 border-amber-100"
                      }`}>
                        {teacher.hasUploaded ? "Uploaded" : "Pending"}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                        {teacher.versions?.length || 0} {teacher.versions?.length === 1 ? "file" : "files"}
                      </span>
                    </div>

                    <div className="font-mono text-[10px] space-y-1 select-none mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300">└─</span>
                        <span className="bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded">
                          {teacher.book || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pl-3">
                        <span className="text-zinc-300">└─</span>
                        <span className="text-zinc-500">{teacher.unit || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-zinc-300">└─</span>
                        <span className="text-zinc-400">{teacher.lesson || "N/A"}</span>
                      </div>
                    </div>

                    {teacher.versions && teacher.versions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {teacher.versions.map((v) => (
                          <a
                            key={v.id}
                            href={v.fileLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-md text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-zinc-400" />
                            <span className="truncate max-w-[120px]">{v.name}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-300 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {teacher.updatedAt && (
                      <p className="flex items-center gap-1 text-[9px] text-zinc-400 font-medium mt-2">
                        <Clock className="w-2.5 h-2.5" />
                        Last updated {new Date(teacher.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openModal(teacher)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/60 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{teacher.hasUploaded ? "Edit / Add" : "Upload"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-zinc-950/10 backdrop-blur-[3px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white border border-zinc-200/80 shadow-[0_24px_64px_rgba(9,9,11,0.10)] rounded-xl z-10 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
                <div>
                  <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-tight">
                    {activeModal.isNew ? "Upload New Lesson Plan" : "Edit Lesson Plan"}
                  </h2>
                  <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                    {profile?.displayName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                      Upload Successful!
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest mt-1">
                      Lesson plan saved to database
                    </p>
                  </div>

                  {successInfo && (
                    <div className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg p-4 text-left space-y-2">
                      {[
                        ["Book", successInfo.book],
                        ["Unit", successInfo.unit],
                        ["Lesson", successInfo.lesson],
                        ["Version", successInfo.version],
                        ["File", successInfo.fileName],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">{label}</span>
                          <span className="text-[10px] font-medium text-zinc-700 text-right truncate max-w-[200px]">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={closeModal}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Book */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Book
                    </label>
                    <CustomSelect
                      value={tempBook}
                      onChange={(v) => { setTempBook(v); setTempUnit(""); setTempLesson(""); }}
                      options={bookOptions}
                      placeholder="Select book..."
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Unit
                    </label>
                    <CustomSelect
                      value={tempUnit}
                      onChange={(v) => { setTempUnit(v); setTempLesson(""); }}
                      options={unitOptions}
                      placeholder="Select unit..."
                      disabled={!tempBook}
                    />
                  </div>

                  {/* Lesson */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Lesson
                    </label>
                    <CustomSelect
                      value={tempLesson}
                      onChange={setTempLesson}
                      options={lessonOptions}
                      placeholder="Select lesson..."
                      disabled={!tempUnit}
                    />
                  </div>

                  {/* Version name */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Version label <span className="text-zinc-300">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={tempVersionName}
                      onChange={(e) => setTempVersionName(e.target.value)}
                      placeholder="e.g. v1, Draft, Final..."
                      className="w-full border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 rounded-lg py-2.5 px-3 outline-none text-sm font-medium text-zinc-700 placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  {/* Dropzone */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Document File
                    </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => modalFileRef.current?.click()}
                      className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-7 px-4 text-center transition-all ${
                        dragActive
                          ? "border-zinc-400 bg-zinc-50"
                          : selectedFile || activeModal?.fileLink
                          ? "border-zinc-200 bg-zinc-50/40"
                          : "border-zinc-200 bg-white hover:bg-zinc-50/40 hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="file"
                        ref={modalFileRef}
                        onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      />
                      {selectedFile ? (
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-zinc-700 truncate max-w-[220px]">{selectedFile.name}</p>
                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · click to swap
                            </p>
                          </div>
                        </div>
                      ) : activeModal?.fileLink ? (
                        <div className="flex items-center gap-2.5">
                          <Check className="w-5 h-5 text-zinc-400 shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-zinc-700">Document loaded</p>
                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Click or drag to replace</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2.5">
                          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                            <Paperclip className="w-4 h-4 text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-600">Drop your file here</p>
                            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">or click to browse · PDF, DOC, PPT</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {modalError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <p className="text-[11px] font-medium text-red-600">{modalError}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isSaving}
                      className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {uploadPercent > 0 ? `${uploadPercent}%` : "Saving..."}
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Submit
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
