import { useState, useRef, useEffect } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { curriculum } from "../data/curriculum";
import { storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Loader2,
  Check,
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  Upload,
  ExternalLink,
  ChevronDown,
  Folder,
  FileText,
  X,
  Paperclip,
  Plus,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Minimalist progressive steps of genuine Zinc color matching the modern Swiss aesthetic
const SHADES = [
  { from: "#fafafa", to: "#f5f5f7" }, // Silk White to Soft Mist
  { from: "#f5f5f7", to: "#f0f0f2" }, // Soft Mist to Light Zinc
  { from: "#f0f0f2", to: "#ebebef" }, // Light Zinc to Satin Gray
  { from: "#ebebef", to: "#e4e4e7" }, // Satin Gray to Classic Zinc
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

// Custom Premium Dropdown Component
function CustomSelect({ value, onChange, options, showAllOption = true, allLabel = "All", disabled = false }) {
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
    <div className={`relative w-full transition-all ${isOpen && !disabled ? "z-[80]" : "z-10"} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none grayscale" : ""}`} ref={containerRef}>
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

export function TeacherView({ filter }) {
  const { teachers, updateTeacher, createTeacher, isLoading, error } = useTeachers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [viewMode, setViewMode] = useState("card"); // 'card' (accordion) or 'list' (flat list)
  const [expandedGroups, setExpandedGroups] = useState(["Group 1", "Group 2", "Group 3", "Group 4"]);
  const [uploadingId, setUploadingId] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // States for adding a new lesson directly from the upload section
  const openAddNewLessonModal = (teacherName = "", groupName = "Group 1", book = "", unit = "", lesson = "") => {
    openUploadModal({
      isNew: true,
      name: teacherName || "Teacher",
      group: groupName || "Group 1",
      book: book || "Spotlight 1",
      unit: unit,
      lesson: lesson,
      hasUploaded: false,
      fileLink: null,
      versions: [],
    });
  };

  const toggleGroup = (groupName) => {
    if (expandedGroups.includes(groupName)) {
      setExpandedGroups(expandedGroups.filter((g) => g !== groupName));
    } else {
      setExpandedGroups([...expandedGroups, groupName]);
    }
  };
  const fileInputRef = useRef(null);

  // High quality modal state variables
  const [activeTeacher, setActiveTeacher] = useState(null);
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
  const [tempTeacherName, setTempTeacherName] = useState("");
  const [tempGroup, setTempGroup] = useState("Group 1");

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const modalFileInputRef = useRef(null);

  // Open modal
  const openUploadModal = (teacher) => {
    setActiveTeacher(teacher);
    setTempBook(teacher.book || "Spotlight 1");
    setTempUnit(teacher.unit || "");
    setTempLesson(teacher.lesson || "");
    setTempVersionName("");
    setTempTeacherName(teacher.name || "");
    setTempGroup(teacher.group || "Group 1");
    setSelectedFile(null);
    setDragActive(false);
    setIsSaving(false);
    setUploadPercent(0);
    setModalError(null);
    setIsSuccess(false);
    setSuccessInfo(null);
  };

  const closeUploadModal = () => {
    setActiveTeacher(null);
    setIsSuccess(false);
    setSuccessInfo(null);
  };

  // Drag and drop events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (modalFileInputRef.current) {
      modalFileInputRef.current.click();
    }
  };

  const handleModalFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!activeTeacher) return;

    if (activeTeacher.isNew && !tempTeacherName.trim()) {
      setModalError("Please enter a teacher name.");
      return;
    }

    if (!tempBook || !tempUnit || !tempLesson) {
      setModalError("Please select Book, Unit, and Lesson.");
      return;
    }

    if (!selectedFile && !activeTeacher.fileLink) {
      setModalError("Please upload or drop a document file.");
      return;
    }

    setIsSaving(true);
    setModalError(null);
    setUploadPercent(0);

    try {
      let downloadURL = activeTeacher.fileLink || null;
      let newVersions = activeTeacher.versions ? [...activeTeacher.versions] : [];

      // Migrate existing fileLink to versions array if it exists but versions array is empty
      if (!activeTeacher.isNew && !activeTeacher.versions && activeTeacher.fileLink) {
        newVersions = [{
          id: "v1",
          name: "v1",
          fileLink: activeTeacher.fileLink,
          uploadedAt: activeTeacher.updatedAt || Date.now()
        }];
      }

      if (selectedFile) {
        // Enforce max 1.5MB file size limit for Base64 conversion stability if offline/fallback is used
        const isTooLargeForFallback = selectedFile.size > 1.5 * 1024 * 1024;
        
        // Upload to Firebase Storage
        const teacherId = activeTeacher.isNew ? `new_${Date.now()}` : activeTeacher.id;
        const storageRef = ref(
          storage,
          `lesson_plans/${teacherId}_${Date.now()}_${selectedFile.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        try {
          // Attempt Firebase Storage up to 6 seconds; on timeout/error we fall back to offline base64
          await Promise.race([
            new Promise((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                  );
                  setUploadPercent(progress);
                },
                (uploadErr) => {
                  reject(uploadErr);
                },
                async () => {
                  try {
                     const url = await getDownloadURL(uploadTask.snapshot.ref);
                     downloadURL = url;
                     resolve();
                  } catch (err) {
                     reject(err);
                  }
                }
              );
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 6000)
            )
          ]);
        } catch (storageErr) {
          console.warn("Storage upload timed out or failed. Running secure inline fallback...", storageErr);
          if (isTooLargeForFallback) {
            throw new Error("File is too large (max 1.5MB for offline fallback storage). Connection error: " + storageErr.message);
          }
          const base64Data = await readFileAsDataURL(selectedFile);
          downloadURL = base64Data;
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
          uploadedAt: Date.now()
        });
      }

      // Save fields to Firestore
      if (activeTeacher.isNew) {
        await createTeacher({
          name: tempTeacherName.trim(),
          book: tempBook,
          unit: tempUnit,
          lesson: tempLesson,
          group: tempGroup,
          hasUploaded: newVersions.length > 0 || !!downloadURL,
          fileLink: downloadURL,
          versions: newVersions,
        });
      } else {
        await updateTeacher(activeTeacher.id, {
          hasUploaded: newVersions.length > 0 || !!downloadURL,
          fileLink: downloadURL,
          versions: newVersions,
          updatedAt: Date.now(),
        });
      }

      // Prepare Success Info and Switch to Success screen
      setSuccessInfo({
        teacherName: activeTeacher.isNew ? tempTeacherName.trim() : activeTeacher.name,
        book: tempBook,
        unit: tempUnit,
        lesson: tempLesson,
        version: tempVersionName.trim() || `v${newVersions.length}`,
        fileName: selectedFile ? selectedFile.name : "Existing document retained"
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("Submit failed in modal: ", err);
      setModalError(err.message || "Failed to update record.");
    } finally {
      setIsSaving(false);
    }
  };



  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50">
        <div className="max-w-md p-6 rounded-md bg-white border border-red-200 shadow-sm">
          <p className="text-sm font-semibold text-red-600 font-mono">
            Error Loading Data
          </p>
          <p className="text-zinc-600 text-xs mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const groups = ["Group 1", "Group 2", "Group 3", "Group 4"];

  const handleCheckboxClick = (teacher) => {
    if (teacher.hasUploaded) {
      updateTeacher(teacher.id, { hasUploaded: false, fileLink: null });
    } else {
      setUploadingId(teacher.id);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId) {
      setUploadingId(null);
      return;
    }

    try {
      const isTooLargeForFallback = file.size > 1.5 * 1024 * 1024;
      let downloadURL = null;

      const storageRef = ref(
        storage,
        `lesson_plans/${uploadingId}_${file.name}`,
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      try {
        await Promise.race([
          new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              () => {},
              (uploadErr) => reject(uploadErr),
              async () => {
                try {
                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                  downloadURL = url;
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 6000)
          )
        ]);
      } catch (storageErr) {
        console.warn("Direct storage upload failed or timed out. Falling back to inline Firestore database storage...", storageErr);
        if (isTooLargeForFallback) {
          alert("Selected document is too large for offline fallback storage (max 1.5MB). Check connection & try again.");
          setUploadingId(null);
          return;
        }
        const base64Data = await readFileAsDataURL(file);
        downloadURL = base64Data;
      }

      if (downloadURL) {
        await updateTeacher(uploadingId, {
          hasUploaded: true,
          fileLink: downloadURL,
          updatedAt: Date.now(),
        });
      }
      setUploadingId(null);
    } catch (err) {
      console.error("Error running direct upload fallback logic: ", err);
      setUploadingId(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filtration logic: State checklist matches book, unit, lesson, search term
  const filteredTeachers = teachers.filter((t) => {
    // Under the requested tracking behavior, we display all assignments/teachers
    // on both views to keep complete track of who has finished their uploads and who hasn't.

    // Book Filter (Dynamic string match helper)
    if (selectedBook && t.book !== selectedBook) return false;

    // Unit Filter (Matches Unit 1 to Unit 10)
    if (selectedUnit && t.unit !== selectedUnit) return false;

    // Lesson Filter (Matches Lesson 1 to Lesson 10)
    if (selectedLesson && t.lesson !== selectedLesson) return false;

    // Text search matches name, book, unit, lesson
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(term);
      const bookMatch = t.book?.toLowerCase().includes(term);
      const unitMatch = t.unit?.toLowerCase().includes(term);
      const lessonMatch = t.lesson?.toLowerCase().includes(term);
      return nameMatch || bookMatch || unitMatch || lessonMatch;
    }

    return true;
  });

  // Options derived from predefined curriculum for filters
  const bookOptions = Object.keys(curriculum);
  
  const uniqueUnits = selectedBook
    ? Object.keys(curriculum[selectedBook] || {})
    : [];
    
  const uniqueLessons = (selectedBook && selectedUnit)
    ? (curriculum[selectedBook][selectedUnit] || [])
    : [];

  // Render the robust filters block beautifully
  const renderFilterControls = () => {
    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* General name/any search with Search Icon */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-md py-1.5 pl-8.5 pr-3 outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-100 placeholder:text-zinc-400/80 text-[10px] font-bold uppercase tracking-wider text-zinc-650 transition-all font-sans"
          />
        </div>

        {/* Book Filter Dropdown */}
        <CustomSelect
          value={selectedBook}
          onChange={(val) => {
            setSelectedBook(val);
            setSelectedUnit("");
            setSelectedLesson("");
          }}
          options={bookOptions}
          showAllOption={true}
          allLabel="All Books"
        />

        {/* Unit Filter Dropdown */}
        <CustomSelect
          value={selectedUnit}
          onChange={(val) => {
            setSelectedUnit(val);
            setSelectedLesson("");
          }}
          options={uniqueUnits}
          showAllOption={true}
          allLabel="All Units"
          disabled={!selectedBook}
        />

        {/* Lesson Filter Dropdown */}
        <CustomSelect
          value={selectedLesson}
          onChange={setSelectedLesson}
          options={uniqueLessons}
          showAllOption={true}
          allLabel="All Lessons"
          disabled={!selectedUnit}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      key={filter}
      className="w-full flex-1 flex flex-col relative"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
      />

      {/* Dynamic tracking metrics panel optimized for tracking teachers list */}
      {filter === "done" && (
        <motion.div
          variants={staggerItem}
          className="mx-8 mt-8 p-6 bg-white border border-zinc-200/80 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.01)]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                School Registry Progress
              </p>
              <h2 className="text-xl font-black tracking-tight text-zinc-800 uppercase mt-1 font-sans">
                Completion Tracker
              </h2>
            </div>
            
            <div className="flex items-center gap-6 font-mono text-[9px] font-bold text-zinc-500 uppercase select-none">
              <div className="flex flex-col">
                <span className="text-zinc-400 tracking-wider">Total Teachers</span>
                <span className="text-lg text-zinc-800 font-extrabold mt-0.5 font-sans">
                  {teachers.reduce((acc, t) => acc.includes(t.name) ? acc : [...acc, t.name], []).length}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-200" />
              <div className="flex flex-col">
                <span className="text-zinc-400 tracking-wider">Total Assignments</span>
                <span className="text-lg text-zinc-800 font-extrabold mt-0.5 font-sans">
                  {teachers.length}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-200" />
              <div className="flex flex-col">
                <span className="text-zinc-400 tracking-wider">Completed Plans</span>
                <span className="text-lg text-emerald-600 font-extrabold mt-0.5 font-sans">
                  {teachers.filter((t) => t.hasUploaded).length}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-200" />
              <div className="flex flex-col">
                <span className="text-zinc-400 tracking-wider">Pending Plans</span>
                <span className="text-lg text-zinc-650 font-extrabold mt-0.5 font-sans">
                  {teachers.filter((t) => !t.hasUploaded).length}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-200" />
              <div className="flex flex-col">
                <span className="text-zinc-400 tracking-wider">Finish Rate</span>
                <span className="text-lg text-zinc-800 font-bold mt-0.5 font-mono">
                  {teachers.length > 0
                    ? Math.round((teachers.filter((t) => t.hasUploaded).length / teachers.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-1 bg-zinc-100 rounded-full mt-5 overflow-hidden relative">
            <motion.div
              className="h-full bg-zinc-800 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${
                  teachers.length > 0
                    ? Math.round((teachers.filter((t) => t.hasUploaded).length / teachers.length) * 100)
                    : 0
                }%`
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* FILTER SECTION (styled like a group, but acts as global filter block) */}
      <motion.div 
        variants={staggerItem}
        className="transition-all duration-300 ease-in-out flex flex-col border-b border-zinc-200/60 relative z-50"
        style={{
          background: `linear-gradient(135deg, #ffffff 0%, #fafafa 100%)`
        }}
      >
        <div
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full text-left px-8 py-5 select-none focus:outline-none shrink-0 cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-baseline gap-4">
             <h1
               className={`text-2xl md:text-3xl font-black uppercase tracking-tighter transition-colors duration-300 ${isFiltersOpen ? "text-zinc-700" : "text-zinc-400 hover:text-zinc-600"}`}
             >
               FILTERS
             </h1>
          </div>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transitionEnd: { overflow: "visible" }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                overflow: "hidden"
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="px-8 pb-8 flex flex-col gap-6 relative z-50">
                
                {/* View Switcher buttons inside filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-widest px-2 py-0.5 rounded border border-zinc-300/40 bg-zinc-100/50">
                        {filteredTeachers.length} results
                     </span>
                     <button
                       type="button"
                       onClick={() => openAddNewLessonModal("", "Group 1", "Spotlight 1", "", "")}
                       className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-white bg-zinc-800 hover:bg-zinc-700 transition-all cursor-pointer shadow-sm font-sans"
                     >
                       <Plus className="w-3.5 h-3.5 text-zinc-150 shrink-0" />
                       <span>Add Lesson Assignment</span>
                     </button>
                  </div>

                  <div className="flex items-center bg-zinc-100/80 p-0.5 rounded-md border border-zinc-200/60 shadow-sm">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-1 px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                        viewMode === "list"
                          ? "bg-white text-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-zinc-200/10"
                          : "text-zinc-400 hover:text-zinc-650"
                      }`}
                    >
                      <LayoutList className="w-3 h-3" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setViewMode("card")}
                      className={`flex items-center gap-1 px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                        viewMode === "card"
                          ? "bg-white text-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-zinc-200/10"
                          : "text-zinc-400 hover:text-zinc-650"
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                {renderFilterControls()}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Accordions Container */}
      <div className="w-full flex-1 flex flex-col divide-y divide-zinc-200/60 bg-transparent min-h-[300px]">
        {/* Empty State Banner when Database is clean / unpopulated */}
        {teachers.length === 0 && (
          <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-24 px-6 text-center select-none animate-fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-2">
              No Lesson Assignments Logged
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Your classroom registry contains no assigned lessons at the moment. Please consult your administrator to register your name and course material.
            </p>
          </div>
        )}

        {teachers.length > 0 && groups.map((groupName, i) => {
          const isExpanded = expandedGroups.includes(groupName);
          const groupTeachersFiltered = filteredTeachers.filter(
            (t) => t.group === groupName,
          );

          const shadeClass = SHADES[i % SHADES.length];
          const titleColor = isExpanded
            ? "text-zinc-700"
            : "text-zinc-400 hover:text-zinc-600";

          return (
            <motion.div
              key={groupName}
              variants={staggerItem}
              style={{
                background: `linear-gradient(135deg, ${shadeClass.from} 0%, ${shadeClass.to} 100%)`
              }}
              className="transition-all duration-300 ease-in-out flex flex-col border-b border-zinc-200/60"
            >
              {/* Accordion Trigger Header Bar with Giant Editorial Title */}
              <div
                onClick={() => toggleGroup(groupName)}
                className="w-full text-left px-8 py-5 select-none focus:outline-none shrink-0 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-baseline gap-4">
                  <h1
                    className={`text-2xl md:text-3xl font-black uppercase tracking-tighter ${titleColor} transition-colors duration-300`}
                  >
                    {groupName}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-400">
                    {groupTeachersFiltered.length}{" "}
                    {groupTeachersFiltered.length === 1
                      ? "teacher"
                      : "teachers"}
                  </span>
                </div>
              </div>

              {/* Expanded contents Area, containing dynamic selectors */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                    animate={{ 
                      opacity: 1, 
                      height: "auto",
                      transitionEnd: { overflow: "visible" }
                    }}
                    exit={{ 
                      opacity: 0, 
                      height: 0,
                      overflow: "hidden" 
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-col"
                  >
                    {/* Accordion contents */}
                    <div className="px-8 pb-8">
                      {groupTeachersFiltered.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 italic text-xs font-medium">
                          No assignments match.
                        </div>
                      ) : viewMode === "card" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupTeachersFiltered.map((teacher, index) => {
                            const isChecked = teacher.hasUploaded;

                            return (
                              <motion.div
                                key={teacher.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.02,
                                  ease: "easeOut",
                                }}
                                className="relative overflow-hidden flex flex-col justify-between p-5 rounded-md bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-white transition-all gap-4 min-h-[175px] shadow-[0_2px_12px_rgba(0,0,0,0.01)] group"
                              >
                                {/* Giant editorial style index number as visual graphic watermark in card background */}
                                <div className="absolute -right-2 -bottom-4 text-[100px] font-black font-sans text-zinc-200/35 group-hover:text-zinc-200/50 transition-colors duration-300 leading-none tracking-tight select-none pointer-events-none">
                                  {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="relative z-10 flex flex-col justify-between h-full w-full">
                                  {/* Status Label Row of Card - No Group Tag Displayed */}
                                  <div className="flex justify-between items-center gap-3 w-full">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded font-bold transition-all border ${
                                        isChecked
                                          ? "text-emerald-705 bg-emerald-50 border-emerald-100"
                                          : "text-zinc-650 bg-zinc-200/50 border-transparent"
                                      }`}>
                                        {isChecked ? "Done" : "Pending"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Middle Info block with elegant alignment */}
                                  <div className="my-4 font-sans">
                                    <h3
                                      onClick={() => openUploadModal(teacher)}
                                      className={`text-base font-bold tracking-tight transition-all cursor-pointer ${
                                        isChecked 
                                          ? "line-through decoration-[2px] decoration-zinc-400 text-zinc-400/80" 
                                          : "text-zinc-700 hover:text-zinc-500"
                                      }`}
                                    >
                                      {teacher.name}
                                    </h3>

                                    {/* Coding tree style visualization of metadata */}
                                    <div className="font-mono text-[9px] mt-3.5 space-y-1.5 select-none py-0.5">
                                      <div className="flex items-center gap-1.5 text-zinc-400">
                                        <span className="text-zinc-300 font-light select-none">└─</span>
                                        <span className="bg-zinc-200/40 text-zinc-700 font-bold px-2 py-0.5 rounded-md truncate tracking-tight">
                                          Book: {teacher.book || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-400 pl-3 leading-none">
                                        <span className="text-zinc-300 font-light select-none">└─</span>
                                        <span className="bg-zinc-100/70 text-zinc-600 px-2 py-0.5 rounded-md truncate tracking-tight font-medium">
                                          Unit: {teacher.unit || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-400 pl-6 leading-none">
                                        <span className="text-zinc-300 font-light select-none">└─</span>
                                        <span className="bg-zinc-50 text-zinc-500 px-2 py-0.5 rounded-md truncate tracking-tight">
                                          Lesson: {teacher.lesson || "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom action bar inside Card (Flat style, no shadow-sm) */}
                                  <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-zinc-100/65 w-full">
                                    {isChecked ? (
                                      <>
                                        {/* Action buttons inside Completed card: All Set (with edit hover) & Add Lesson */}
                                        <div className="grid grid-cols-2 gap-2 w-full mt-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUploadModal(teacher);
                                            }}
                                            className="relative overflow-hidden flex items-center justify-center h-[32px] px-3 rounded-md text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-zinc-100 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer group/btn select-none"
                                          >
                                            <div className="flex items-center justify-center gap-1 transition-all duration-200 group-hover/btn:opacity-0 group-hover/btn:-translate-y-1">
                                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span>All Set</span>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 translate-y-1 transition-all duration-200 group-hover/btn:opacity-1 group-hover/btn:translate-y-0 text-zinc-700">
                                              <Edit className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                              <span>Edit</span>
                                            </div>
                                          </button>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openAddNewLessonModal(teacher.name, teacher.group, teacher.book, "", "");
                                            }}
                                            className="flex items-center justify-center h-[32px] px-3 rounded-md text-[10px] font-bold uppercase tracking-wide text-zinc-650 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/60 hover:border-zinc-350 transition-all cursor-pointer"
                                          >
                                            <Plus className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                            <span>Add Lesson</span>
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUploadModal(teacher);
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-700 hover:bg-zinc-600 transition-all"
                                      >
                                        <Upload className="w-3.5 h-3.5 text-zinc-300" />
                                        <span>Upload Plan</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Clean, Elegant list view inside Accordion with NO checkboxes as requested */
                        <div className="flex flex-col divide-y divide-zinc-200/60 bg-white border border-zinc-200 rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                          {groupTeachersFiltered.map((teacher, index) => {
                            const isChecked = teacher.hasUploaded;

                            return (
                              <div
                                key={teacher.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white hover:bg-zinc-50/40 transition-colors gap-4"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-zinc-400 font-mono font-bold">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <div>
                                    <h3
                                      onClick={() => openUploadModal(teacher)}
                                      className={`text-sm font-bold tracking-tight transition-all cursor-pointer ${
                                        isChecked 
                                          ? "line-through decoration-[1.5px] decoration-zinc-400 text-zinc-400/80" 
                                          : "text-zinc-700 hover:text-zinc-500"
                                      }`}
                                    >
                                      {teacher.name}
                                    </h3>
                                    {/* Coding tree style visualization of metadata */}
                                    <div className="font-mono text-[9px] mt-3.5 space-y-1.5 select-none py-0.5">
                                      <div className="flex items-center gap-1.5 text-zinc-400">
                                        <span className="text-zinc-300 font-light select-none">└─</span>
                                        <span className="bg-zinc-200/40 text-zinc-700 font-bold px-2 py-0.5 rounded-md truncate tracking-tight">
                                          Book: {teacher.book || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-400 pl-3 leading-none">
                                        <span className="text-zinc-300 font-light select-none">└─</span>
                                        <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md truncate tracking-tight font-medium">
                                          Unit: {teacher.unit || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-400 pl-6 leading-none">
                                        <span className="text-zinc-300 font-light select-none">└─</span>
                                        <span className="bg-zinc-50 text-zinc-500 px-2 py-0.5 rounded-md truncate tracking-tight">
                                          Lesson: {teacher.lesson || "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mr-2">
                                    <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-1 rounded font-bold transition-all border ${
                                      isChecked
                                        ? "text-emerald-705 bg-emerald-50 border-emerald-100"
                                        : "text-zinc-650 bg-zinc-200/50 border-transparent"
                                    }`}>
                                      {isChecked ? "Done" : "Pending"}
                                    </span>
                                  </div>

                                  {isChecked ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUploadModal(teacher);
                                          }}
                                          className="relative overflow-hidden flex items-center justify-center h-[32px] px-3.5 rounded-md text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-zinc-100 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer group/btn select-none"
                                        >
                                          <div className="flex items-center gap-1 transition-all duration-200 group-hover/btn:opacity-0 group-hover/btn:-translate-y-1">
                                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span>All Set</span>
                                          </div>
                                          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 translate-y-1 transition-all duration-200 group-hover/btn:opacity-1 group-hover/btn:translate-y-0 text-zinc-700">
                                            <Edit className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                            <span>Edit</span>
                                          </div>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openAddNewLessonModal(teacher.name, teacher.group, teacher.book, "", "");
                                          }}
                                          className="flex items-center h-[32px] px-3.5 rounded-md text-[10px] font-bold uppercase tracking-wide text-zinc-650 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/60 hover:border-zinc-350 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                          <span>Add Lesson</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openUploadModal(teacher);
                                      }}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-700 hover:bg-zinc-600 transition-all"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-zinc-300" />
                                      <span>Upload</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* High precision modal for lesson details configuration & drag drop docs */}
      <AnimatePresence>
        {activeTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blend overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeUploadModal}
              className="absolute inset-0 bg-zinc-950/10 backdrop-blur-[4px]"
            />

            {/* Modal frame content container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white border border-zinc-200/50 shadow-[0_24px_64px_rgba(9,9,11,0.08)] rounded-md flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/20 select-none rounded-t-md">
                <div>
                  <h2 className="text-xs font-bold text-zinc-650 uppercase tracking-tight">
                    {activeTeacher.isNew ? "Add Lesson Assignment" : `Teacher: ${activeTeacher.name}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Form content */}
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                    <Check className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Successfully Processed
                    </h3>
                    <p className="text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest mt-1">
                      Lesson Plan Logged
                    </p>
                  </div>

                  {successInfo && (
                    <div className="w-full bg-zinc-50 border border-zinc-200/50 rounded-md p-4 text-left space-y-2 border-dashed">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider border-b border-zinc-200/40 pb-1.5 font-bold">
                        <span className="text-zinc-400">Teacher</span>
                        <span className="text-zinc-700">{successInfo.teacherName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider border-b border-zinc-200/40 pb-1.5 font-bold">
                        <span className="text-zinc-400 font-sans">Curriculum</span>
                        <span className="text-zinc-700 truncate max-w-[180px]">{successInfo.book}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider border-b border-zinc-200/40 pb-1.5 font-bold">
                        <span className="text-zinc-400 font-sans">Unit & Lesson</span>
                        <span className="text-zinc-700 font-mono text-[8px]">{successInfo.unit} &bull; {successInfo.lesson}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider border-b border-zinc-200/40 pb-1.5 font-bold">
                        <span className="text-zinc-400 font-sans">Version</span>
                        <span className="text-zinc-700 font-mono text-[8px]">{successInfo.version}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                        <span className="text-zinc-400 font-sans">Document</span>
                        <span className="text-zinc-700 truncate max-w-[150px]" title={successInfo.fileName}>
                          {successInfo.fileName}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="w-full py-2 bg-zinc-850 hover:bg-zinc-750 text-white text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleModalSubmit} className="flex-1 flex flex-col p-5 space-y-4">
                  
                  {/* Book Name field */}
                  <div className="space-y-1 font-sans">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Book Name
                    </label>
                    <CustomSelect
                      value={tempBook}
                      onChange={(val) => {
                        setTempBook(val);
                        setTempUnit("");
                        setTempLesson("");
                      }}
                      options={Object.keys(curriculum)}
                      showAllOption={true}
                      allLabel="Select Book"
                    />
                  </div>

                  {/* Unit field */}
                  <div className="space-y-1 font-sans">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Unit Name & Number
                    </label>
                    <CustomSelect
                      value={tempUnit}
                      onChange={(val) => {
                        setTempUnit(val);
                        setTempLesson("");
                      }}
                      options={tempBook ? Object.keys(curriculum[tempBook] || {}) : []}
                      showAllOption={true}
                      allLabel="Select Unit"
                      disabled={!tempBook}
                    />
                  </div>

                  {/* Lesson field */}
                  <div className="space-y-1 font-sans">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Lesson Name & Number
                    </label>
                    <CustomSelect
                      value={tempLesson}
                      onChange={(val) => setTempLesson(val)}
                      options={(tempBook && tempUnit) ? (curriculum[tempBook][tempUnit] || []) : []}
                      showAllOption={true}
                      allLabel="Select Lesson"
                      disabled={!tempUnit}
                    />
                  </div>

                  {/* Version field */}
                  <div className="space-y-1 font-sans">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block">
                      Version Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={tempVersionName}
                      onChange={(e) => setTempVersionName(e.target.value)}
                      placeholder="e.g. v1, v2, v3 or Draft"
                      className="w-full bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 focus:border-zinc-300 focus:bg-white focus:ring-1 focus:ring-zinc-100 rounded-md py-1.5 px-3 outline-none text-xs text-zinc-650 placeholder:text-zinc-400 transition-all font-semibold"
                    />
                  </div>

                  {/* Dropzone field */}
                  <div className="space-y-1.5 select-none text-center">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block text-left">
                      Lesson Plan Document
                    </label>
   
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`cursor-pointer group flex flex-col items-center justify-center border border-dashed rounded-md py-6 px-4 text-center transition-all ${
                        dragActive
                          ? "border-zinc-400 bg-zinc-50"
                          : selectedFile || activeTeacher.fileLink
                          ? "border-zinc-200 bg-zinc-50/30 hover:bg-zinc-50/60"
                          : "border-zinc-200/80 bg-white hover:bg-zinc-50/40 hover:border-zinc-350"
                      }`}
                    >
                      <input
                        type="file"
                        ref={modalFileInputRef}
                        onChange={handleModalFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      />

                      <div className="mt-1 text-xs w-full flex justify-center">
                        {selectedFile ? (
                          <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/50 py-1.5 px-3.5 rounded-md max-w-full">
                            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                            <div className="text-left truncate max-w-[220px]">
                              <p className="text-[10px] font-bold text-zinc-700 truncate">{selectedFile.name}</p>
                              <p className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wide">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — swap document
                              </p>
                            </div>
                          </div>
                        ) : activeTeacher.fileLink ? (
                          <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/50 py-1.5 px-3.5 rounded-md max-w-full">
                            <Check className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div className="text-left truncate max-w-[220px]">
                              <p className="text-[10px] font-bold text-zinc-700 truncate">Document Loaded</p>
                              <p className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-wide">
                                Drag or click here to replace document
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-2 bg-zinc-50 rounded-md group-hover:scale-105 transition-transform duration-205 text-zinc-400 group-hover:text-zinc-500 border border-zinc-100">
                              <Paperclip className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-zinc-650 block text-[10px] uppercase tracking-wider">
                                Drop plan document here
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">
                                or click to browse documents
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error handling layout */}
                  {modalError && (
                    <div className="bg-red-50 text-[9px] font-mono font-bold uppercase tracking-wider text-red-500 p-2 text-center rounded-md border border-red-100">
                      {modalError}
                    </div>
                  )}

                  {/* Submit panel bottom buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeUploadModal}
                      disabled={isSaving}
                      className="flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-650 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white bg-zinc-700 hover:bg-zinc-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{uploadPercent > 0 ? `${uploadPercent}%` : "Storing..."}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Submit Details</span>
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
    </motion.div>
  );
}
