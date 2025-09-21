import type { PropsWithChildren, ReactElement } from "react";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  DocumentSnapshot,
  FirestoreError,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { Navigate } from "react-router-dom";

import type { UserProfile } from "./types";

type FirebaseConfig = Record<string, string | undefined>;

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    console.warn(`Missing Firebase env configuration for ${key}`);
  }
}

const emailRedirect = import.meta.env.VITE_FIREBASE_EMAIL_LINK_REDIRECT || window.location.origin;

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig as FirebaseOptions)
    : getApps()[0]!;
const auth = getAuth(app);
const db = getFirestore(app);

const AUTH_EMAIL_KEY = "dinbhar-poster-auth-email";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, "profiles", firebaseUser.uid);
      unsubscribeProfile = onSnapshot(
        profileRef,
        async (snapshot: DocumentSnapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Omit<UserProfile, "id">;
            setProfile({ id: snapshot.id, ...data });
          } else {
            const fallbackProfile: UserProfile = {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName ?? firebaseUser.email ?? "",
              email: firebaseUser.email ?? "",
              role: "editor",
            };
            setProfile(fallbackProfile);
            await setDoc(profileRef, { ...fallbackProfile, createdAt: serverTimestamp() }, { merge: true });
          }
          setLoading(false);
        },
        (error: FirestoreError) => {
          console.error("Failed to read profile", error);
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      unsubscribeAuth();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    async signInWithEmail(email: string, password: string) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async register(displayName: string, email: string, password: string) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      const profileRef = doc(db, "profiles", credential.user.uid);
      await setDoc(
        profileRef,
        {
          displayName,
          email,
          role: "editor",
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    async sendMagicLink(email: string) {
      window.localStorage.setItem(AUTH_EMAIL_KEY, email);
      await sendSignInLinkToEmail(auth, email, {
        url: emailRedirect,
        handleCodeInApp: true,
      });
    },
    async completeMagicLink(emailFromUser?: string) {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }
      const storedEmail = window.localStorage.getItem(AUTH_EMAIL_KEY);
      const email = emailFromUser ?? storedEmail;
      if (!email) {
        throw new Error("Please provide your email address to complete sign-in.");
      }
      const credential = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem(AUTH_EMAIL_KEY);
      const profileRef = doc(db, "profiles", credential.user.uid);
      const snapshot = await getDoc(profileRef);
      if (!snapshot.exists()) {
        await setDoc(
          profileRef,
          {
            displayName: credential.user.displayName ?? email.split("@")[0],
            email,
            role: "editor",
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    },
    async signOutUser() {
      await signOut(auth);
    },
  }), [user, profile, loading]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface RouteGuardProps {
  children: ReactElement;
}

export const ProtectedRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();
  if (loading) {
    return createElement(
      "div",
      { className: "flex min-h-[40vh] items-center justify-center text-lg font-semibold text-slate-600" },
      "Loading account…",
    );
  }
  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  return children;
};

export const AdminRoute = ({ children }: RouteGuardProps) => {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return createElement(
      "div",
      { className: "flex min-h-[40vh] items-center justify-center text-lg font-semibold text-slate-600" },
      "Checking permissions…",
    );
  }
  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  if (profile?.role !== "admin") {
    return createElement(Navigate, { to: "/", replace: true });
  }
  return children;
};

export { auth, db, isSignInWithEmailLink };
