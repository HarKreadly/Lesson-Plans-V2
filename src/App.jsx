import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { TeacherPortal } from "./components/TeacherPortal";
import { DocumentsView } from "./components/DocumentsView";
import { InstructionsView } from "./components/InstructionsView";
import { AdminView } from "./components/AdminView";
import { AuthScreen } from "./components/AuthScreen";
import { CompletedView } from "./components/CompletedView";
import { UploadGate } from "./components/UploadGate";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2, LogOut, User } from "lucide-react";

function NavBar() {
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Instructions" },
    { path: "/upload", label: "Upload" },
    { path: "/completed", label: "Completed" },
    { path: "/documents", label: "Documents" },
    ...(user ? [{ path: "/admin", label: "Admin" }] : []),
  ];

  // Get initials for avatar
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="w-full bg-[#f4f4f5]/30 backdrop-blur-md border-b border-zinc-300/20 shrink-0 select-none z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-0 flex flex-col">
        {/* Title row */}
        <div className="flex items-center mb-6">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-zinc-800 font-sans flex-1">
            Lesson Plans
          </h1>
        </div>

        {/* Nav tabs */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <nav className="flex items-center gap-8 flex-wrap">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`pb-3 text-[11px] font-bold tracking-wider uppercase transition-all duration-200 border-b-2 ${
                  location.pathname === path
                    ? "border-zinc-800 text-zinc-800"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex justify-end pb-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/80 border border-zinc-200/60 rounded-lg px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-white uppercase">{initials}</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-bold text-zinc-700 leading-none">
                      {profile?.firstName ?? user.email}
                    </p>
                    {profile?.group && (
                      <p className="text-[8px] text-zinc-400 font-medium mt-0.5 uppercase tracking-wide">
                        {profile.group}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/60 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                id="navbar-signin-link"
                className={`pb-3 text-[11px] font-bold tracking-wider uppercase transition-all duration-200 border-b-2 ${
                  location.pathname === "/login"
                    ? "border-zinc-800 text-zinc-800"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                }`}
              >
                Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <UploadGate />;
  return <TeacherPortal />;
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-zinc-700 font-sans flex flex-col">
      <NavBar />
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<InstructionsView />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/completed" element={<CompletedView />} />
          <Route path="/documents" element={<DocumentsView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="*" element={<InstructionsView />} />
        </Routes>
      </div>
    </div>
  );
}

function AppRouter() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mt-3">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthScreen />} />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
