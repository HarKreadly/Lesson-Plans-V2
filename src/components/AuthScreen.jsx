import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  ChevronDown,
  Loader2,
  AlertCircle,
  ArrowRight,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const GROUPS = ["1", "2", "3", "4"];

/* ── Google Icon SVG ────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Group Dropdown ─────────────────────────────────────────── */
function GroupSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="ag-field" ref={ref}>
      <div className="ag-field-icon"><Users size={15} /></div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ag-field-input ag-select-btn"
      >
        <span className={value ? "ag-select-val" : "ag-select-placeholder"}>
          {value ? `Group ${value}` : "Select your group"}
        </span>
        <ChevronDown size={14} className={`ag-chevron ${isOpen ? "open" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="ag-dropdown"
          >
            {GROUPS.map((g) => (
              <li
                key={g}
                onClick={() => { onChange(g); setIsOpen(false); }}
                className={`ag-dropdown-item ${value === g ? "active" : ""}`}
              >
                Group {g}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export function AuthScreen() {
  const { googleSignIn, emailSignIn, emailSignUp, completeProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("signin"); // "signin" | "profile"
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Profile completion state (prefilled from Google)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [group, setGroup] = useState("1");

  /* ── Google Sign-In ── */
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      setIsLoading(true);
      const result = await googleSignIn();
      if (result.isNewUser) {
        // Pre-fill name from Google account
        const parts = (result.googleUser.displayName || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setStep("profile");
      } else {
        navigate("/upload");
      }
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);
      setError(`Sign-in failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await emailSignUp(email, password);
      } else {
        result = await emailSignIn(email, password);
      }
      
      if (result.isNewUser) {
        setStep("profile");
      } else {
        navigate("/upload");
      }
    } catch (err) {
      console.error("Email auth error:", err.code, err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Profile completion ── */
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!group) {
      setError("Please select your group.");
      return;
    }
    setIsLoading(true);
    try {
      await completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        group,
      });
      navigate("/upload");
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Could not save your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ag-root">

        {/* ── Left panel ── */}
        <div className="ag-left" aria-hidden="true">
          <div className="ag-left-overlay" />
          <div className="ag-left-content">
            <div className="ag-left-badge">Teacher Portal</div>
            <h2 className="ag-left-headline">
              Organize.<br />Plan.<br />Inspire.
            </h2>
            <p className="ag-left-sub">
              Your lesson planning workspace, built for modern educators.
            </p>
            <div className="ag-left-dots">
              <span className="active" /><span /><span />
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="ag-right">
          <div className="ag-form-box">

            {/* Logo */}
            <div className="ag-logo">
              <div className="ag-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <span className="ag-logo-text">Lesson Plans</span>
            </div>

            <AnimatePresence mode="wait">

              {/* ── Step 1: Sign In ── */}
              {step === "signin" && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="ag-title">{isSignUp ? "Create Account" : "Welcome back"}</h1>
                  <p className="ag-subtitle">
                    {isSignUp ? "Sign up as a teacher to continue." : "Sign in to your teacher account to continue."}
                  </p>

                  <form onSubmit={handleEmailAuth} className="ag-profile-form">
                    <div className="ag-field">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ag-field-input"
                        required
                      />
                    </div>
                    <div className="ag-field">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ag-field-input"
                        required
                      />
                    </div>
                    
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ag-error mt-2"
                        >
                          <AlertCircle size={13} />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="ag-submit-btn mt-2"
                    >
                      {isLoading ? (
                        <Loader2 size={17} className="ag-spin" />
                      ) : (
                        <span>{isSignUp ? "Sign Up with Email" : "Sign In with Email"}</span>
                      )}
                    </button>
                  </form>

                  <div className="ag-divider">
                    <span>OR</span>
                  </div>

                  <button
                    id="google-signin-btn"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="ag-google-btn"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="ag-spin" />
                    ) : (
                      <>
                        <GoogleIcon />
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  <p className="ag-note mt-4">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button 
                      type="button" 
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-zinc-800 font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: Profile Completion ── */}
              {step === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="ag-step-badge">
                    <CheckCircle2 size={14} />
                    Google account connected
                  </div>
                  <h1 className="ag-title">Set up your profile</h1>
                  <p className="ag-subtitle">
                    Just a few details and you're ready to go.
                  </p>

                  <form onSubmit={handleProfileSubmit} className="ag-profile-form" noValidate>
                    <div className="ag-row-2">
                      <div className="ag-field">
                        <div className="ag-field-icon"><User size={15} /></div>
                        <input
                          id="profile-firstname"
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="ag-field-input"
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="ag-field">
                        <div className="ag-field-icon"><User size={15} /></div>
                        <input
                          id="profile-lastname"
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="ag-field-input"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <GroupSelect value={group} onChange={setGroup} />

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ag-error"
                        >
                          <AlertCircle size={13} />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      id="profile-submit-btn"
                      type="submit"
                      disabled={isLoading}
                      className="ag-submit-btn"
                    >
                      {isLoading ? (
                        <Loader2 size={17} className="ag-spin" />
                      ) : (
                        <>
                          <span>Complete Setup</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>

            <p className="ag-footer">Lesson Plans Portal · {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ag-root {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', system-ui, sans-serif;
    background: #fafaf9;
  }

  /* ── Left panel ── */
  .ag-left {
    display: none;
    position: relative;
    flex: 1;
    background-image: url('/auth-bg.png');
    background-size: cover;
    background-position: center;
    overflow: hidden;
  }
  @media (min-width: 768px) { .ag-left { display: flex; } }

  .ag-left-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      145deg,
      rgba(9,9,11,0.62) 0%,
      rgba(9,9,11,0.35) 55%,
      rgba(9,9,11,0.12) 100%
    );
  }

  .ag-left-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 3rem;
    height: 100%;
    color: #fff;
  }

  .ag-left-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.3rem 0.8rem;
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 100px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    margin-bottom: 1.4rem;
  }

  .ag-left-headline {
    font-size: clamp(2.2rem, 3.8vw, 3.2rem);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
  }

  .ag-left-sub {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.65);
    max-width: 20rem;
    line-height: 1.65;
    margin-bottom: 2.5rem;
  }

  .ag-left-dots { display: flex; gap: 6px; }
  .ag-left-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
  }
  .ag-left-dots span.active {
    width: 20px;
    border-radius: 3px;
    background: rgba(255,255,255,0.85);
  }

  /* ── Right panel ── */
  .ag-right {
    flex: none;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    background: #fafaf9;
  }
  @media (min-width: 768px) {
    .ag-right { width: 460px; flex-shrink: 0; }
  }

  .ag-form-box {
    width: 100%;
    max-width: 360px;
  }

  /* ── Logo ── */
  .ag-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 2.5rem;
  }
  .ag-logo-icon {
    width: 34px; height: 34px;
    border-radius: 9px;
    background: #18181b;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ag-logo-text {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #18181b;
    letter-spacing: -0.02em;
  }

  /* ── Titles ── */
  .ag-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #18181b;
    letter-spacing: -0.025em;
    margin-bottom: 0.4rem;
  }
  .ag-subtitle {
    font-size: 13.5px;
    color: #71717a;
    line-height: 1.55;
    margin-bottom: 1.75rem;
  }

  /* ── Step badge ── */
  .ag-step-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.3rem 0.75rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: #16a34a;
    margin-bottom: 1rem;
  }

  /* ── Google button ── */
  .ag-google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 13px 20px;
    background: #fff;
    border: 1.5px solid #e4e4e7;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 600;
    color: #18181b;
    cursor: pointer;
    transition: all 0.16s ease;
    font-family: inherit;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    margin-bottom: 0.875rem;
  }
  .ag-google-btn:hover:not(:disabled) {
    border-color: #d4d4d8;
    box-shadow: 0 4px 12px rgba(0,0,0,0.09);
    transform: translateY(-1px);
  }
  .ag-google-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  }
  .ag-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Error ── */
  .ag-error {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    padding: 9px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 500;
    color: #dc2626;
    line-height: 1.45;
    margin-bottom: 0.75rem;
    overflow: hidden;
  }
  .ag-error svg { flex-shrink: 0; margin-top: 1px; }

  /* ── Divider ── */
  .ag-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 1.25rem 0 1rem;
  }
  .ag-divider::before, .ag-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e4e4e7;
  }
  .ag-divider span {
    font-size: 10.5px;
    font-weight: 600;
    color: #a1a1aa;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Note ── */
  .ag-note {
    font-size: 12px;
    color: #a1a1aa;
    line-height: 1.6;
    text-align: center;
  }

  /* ── Profile form ── */
  .ag-profile-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ag-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  /* ── Field ── */
  .ag-field {
    position: relative;
    display: flex;
    align-items: center;
    background: #fff;
    border: 1.5px solid #e4e4e7;
    border-radius: 10px;
    transition: border-color 0.14s, box-shadow 0.14s;
  }
  .ag-field:focus-within {
    border-color: #a1a1aa;
    box-shadow: 0 0 0 3px rgba(161,161,170,0.14);
  }
  .ag-field:hover:not(:focus-within) { border-color: #d4d4d8; }

  .ag-field-icon {
    display: flex;
    align-items: center;
    padding: 0 0 0 12px;
    color: #a1a1aa;
    flex-shrink: 0;
  }

  .ag-field-input {
    flex: 1;
    padding: 11px 12px;
    font-size: 13.5px;
    font-weight: 500;
    color: #18181b;
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    min-width: 0;
  }
  .ag-field-input::placeholder { color: #a1a1aa; font-weight: 400; }

  /* ── Select ── */
  .ag-select-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    border: none;
    background: transparent;
    font-family: inherit;
  }
  .ag-select-val { color: #18181b; font-size: 13.5px; font-weight: 500; }
  .ag-select-placeholder { color: #a1a1aa; font-size: 13.5px; font-weight: 400; }

  .ag-chevron {
    color: #a1a1aa;
    transition: transform 0.15s;
    margin-right: 12px;
    flex-shrink: 0;
  }
  .ag-chevron.open { transform: rotate(180deg); }

  /* ── Dropdown ── */
  .ag-dropdown {
    position: absolute;
    left: 0; right: 0;
    top: calc(100% + 6px);
    z-index: 100;
    background: #fff;
    border: 1.5px solid #e4e4e7;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.09);
    padding: 4px;
    list-style: none;
  }
  .ag-dropdown-item {
    padding: 9px 12px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    color: #3f3f46;
    cursor: pointer;
    transition: background 0.1s;
    font-family: inherit;
  }
  .ag-dropdown-item:hover { background: #f4f4f5; color: #18181b; }
  .ag-dropdown-item.active { background: #f4f4f5; color: #18181b; font-weight: 600; }

  /* ── Submit button ── */
  .ag-submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    margin-top: 4px;
    background: #18181b;
    color: #fff;
    font-size: 13.5px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    font-family: inherit;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .ag-submit-btn:hover:not(:disabled) {
    background: #27272a;
    box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    transform: translateY(-1px);
  }
  .ag-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .ag-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Spin ── */
  .ag-spin { animation: ag-spin 0.75s linear infinite; }
  @keyframes ag-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ── Footer ── */
  .ag-footer {
    text-align: center;
    font-size: 11px;
    color: #a1a1aa;
    margin-top: 2rem;
    letter-spacing: 0.01em;
  }
`;
