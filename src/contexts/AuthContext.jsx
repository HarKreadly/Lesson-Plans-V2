import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data());
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setProfile(null);
          handleFirestoreError(err, OperationType.GET, "users");
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Sign in with Google popup.
   * Returns { isNewUser: boolean, googleUser: object } so the UI
   * can decide whether to show the profile-completion step.
   */
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    let credential;
    try {
      credential = await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google sign-in failed:", err.code, err.message);
      throw err;
    }

    const firebaseUser = credential.user;
    setUser(firebaseUser);

    // Check if a Firestore profile already exists
    try {
      const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data());
        return { isNewUser: false };
      }
    } catch (err) {
      console.warn("Profile fetch failed (will treat as new user):", err);
      handleFirestoreError(err, OperationType.GET, "users");
    }

    // No profile found â€” new user, return Google account info
    return {
      isNewUser: true,
      googleUser: {
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || null,
      },
    };
  };

  const emailSignIn = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    setUser(firebaseUser);

    try {
      const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data());
        return { isNewUser: false };
      }
    } catch (err) {
      console.warn("Profile fetch failed:", err);
      handleFirestoreError(err, OperationType.GET, "users");
    }

    return {
      isNewUser: true,
      googleUser: {
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || null,
      },
    };
  };

  const emailSignUp = async (email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    setUser(firebaseUser);

    return {
      isNewUser: true,
      googleUser: {
        displayName: "",
        email: firebaseUser.email || "",
        photoURL: null,
      },
    };
  };

  /**
   * Called after new-user profile form is submitted.
   * Creates the Firestore document for the teacher.
   */
  const completeProfile = async ({ firstName, lastName, group }) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("No authenticated user");

    // Update Firebase Auth display name
    try {
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`,
      });
    } catch (err) {
      console.warn("updateProfile failed (non-fatal):", err);
    }

    const profileData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      group: group || "1",
      role: "teacher",
      photoURL: firebaseUser.photoURL || null,
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "users", firebaseUser.uid), profileData);
      setProfile(profileData);
    } catch (err) {
      console.error("Firestore profile save failed:", err.code, err.message);
      handleFirestoreError(err, OperationType.CREATE, "users");
    }

    return profileData;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, googleSignIn, emailSignIn, emailSignUp, completeProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
