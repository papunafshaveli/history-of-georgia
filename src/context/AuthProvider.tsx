import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";

import { auth } from "@/firebase";
import { logger } from "@/src/helpers/logger";
import { ensureUserDoc } from "@/src/services/firestore-user";

type AuthContextValue = {
  user: User | null;
  uid: string | null;
  isAnonymous: boolean;
  isAuthenticating: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  bumpAuthVersion: () => void;
};

const notImplemented = (which: string) => () =>
  Promise.reject(
    new Error(
      `[AuthProvider] ${which} is not yet implemented. Wired up in Phase 4.`,
    ),
  );

const defaultContext: AuthContextValue = {
  user: null,
  uid: null,
  isAnonymous: true,
  isAuthenticating: true,
  signInWithGoogle: notImplemented("signInWithGoogle"),
  signInWithApple: notImplemented("signInWithApple"),
  signOut: notImplemented("signOut"),
  updateDisplayName: notImplemented("updateDisplayName"),
  bumpAuthVersion: () => undefined,
};

export const AuthContext = createContext<AuthContextValue>(defaultContext);

type AuthProviderProps = { children: React.ReactNode };

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authVersion, setAuthVersion] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const ensuringRef = useRef<string | null>(null);

  const bumpAuthVersion = useCallback(() => {
    setAuthVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let unsubscribed = false;

    const unsubscribe = onAuthStateChanged(auth, async (next) => {
      if (unsubscribed) return;

      if (next) {
        setUser(next);

        if (ensuringRef.current !== next.uid) {
          ensuringRef.current = next.uid;
          try {
            await ensureUserDoc(next.uid, next.isAnonymous);
          } catch (error) {
            logger.warn("[AuthProvider] ensureUserDoc failed:", error);
          }
        }

        bumpAuthVersion();
        setIsAuthenticating(false);
        return;
      }

      try {
        await signInAnonymously(auth);
      } catch (error) {
        logger.warn("[AuthProvider] signInAnonymously failed:", error);
        setIsAuthenticating(false);
      }
    });

    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, [bumpAuthVersion]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      uid: user?.uid ?? null,
      isAnonymous: user?.isAnonymous ?? true,
      isAuthenticating,
      signInWithGoogle: notImplemented("signInWithGoogle"),
      signInWithApple: notImplemented("signInWithApple"),
      signOut: notImplemented("signOut"),
      updateDisplayName: notImplemented("updateDisplayName"),
      bumpAuthVersion,
    }),
    [user, authVersion, isAuthenticating, bumpAuthVersion],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};
