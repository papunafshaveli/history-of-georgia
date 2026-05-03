import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  OAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInAnonymously,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

import { auth } from "@/firebase";
import { IS_IOS } from "@/src/constants/platform";
import { logger } from "@/src/helpers/logger";
import { showToast } from "@/src/helpers/showToast";
import {
  ensureUserDoc,
  updateDisplayName as updateDisplayNameService,
  updateProviderProfile,
} from "@/src/services/firestore-user";
import { deleteUserData } from "@/src/services/firestore-account-deletion";
import { clearPendingResults } from "@/src/services/pending-results";
import { useTranslation } from "@/src/hooks/useTranslation";

export type SignInResult = {
  /**
   * True when the OAuth credential was just linked to the previously
   * anonymous user. Consumers use this to gate one-time UX (e.g. opening
   * ConfirmNameModal). False when we fell back to signInWithCredential
   * because the credential already belonged to another UID, or when the
   * user cancelled the OAuth flow.
   */
  wasFirstLink: boolean;
  /**
   * Display name resolved from the OAuth provider (Google `name`, Apple
   * `fullName`) or the existing Firebase user record. Null when neither
   * source provided one. Pre-fills `ConfirmNameModal` so the user sees
   * their provider name as the starting point.
   */
  displayName: string | null;
};

type AuthContextValue = {
  user: User | null;
  uid: string | null;
  isAnonymous: boolean;
  isAuthenticating: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<SignInResult>;
  signInWithApple: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  bumpAuthVersion: () => void;
};

const notImplemented = (which: string) => () =>
  Promise.reject(
    new Error(
      `[AuthProvider] ${which} is not yet implemented. Wired up in Phase 4.`,
    ),
  );

const hasErrorCode = (
  err: unknown,
  code: string,
): err is { code: string } =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: unknown }).code === code;

const isEmailCollisionError = (err: unknown): boolean =>
  hasErrorCode(err, "auth/email-already-in-use") ||
  hasErrorCode(err, "auth/account-exists-with-different-credential");

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const formatAppleFullName = (
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null => {
  if (!fullName) return null;
  const parts = [fullName.givenName, fullName.familyName].filter(
    (s): s is string => Boolean(s && s.trim()),
  );
  if (parts.length === 0) return null;
  return parts.join(" ");
};

const defaultContext: AuthContextValue = {
  user: null,
  uid: null,
  isAnonymous: true,
  isAuthenticating: true,
  isSigningIn: false,
  signInWithGoogle: notImplemented("signInWithGoogle"),
  signInWithApple: notImplemented("signInWithApple"),
  signOut: notImplemented("signOut"),
  updateDisplayName: notImplemented("updateDisplayName"),
  deleteAccount: notImplemented("deleteAccount"),
  bumpAuthVersion: () => undefined,
};

export const AuthContext = createContext<AuthContextValue>(defaultContext);

type AuthProviderProps = { children: React.ReactNode };

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const t = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [authVersion, setAuthVersion] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const ensuringRef = useRef<string | null>(null);
  const googleConfiguredRef = useRef(false);

  const showAccountExistsToast = useCallback(() => {
    showToast({
      type: "error",
      text1: t.common_account_exists_title,
      text2: t.common_account_exists_message,
    });
  }, [t]);

  const bumpAuthVersion = useCallback(() => {
    setAuthVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (googleConfiguredRef.current) return;
    googleConfiguredRef.current = true;

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
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

  const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return { wasFirstLink: false, displayName: null };
      }

      const { idToken, user: providerUser } = response.data;
      if (!idToken) {
        throw new Error("[AuthProvider] Google response missing idToken");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const current = auth.currentUser;

      let signedIn;
      let wasFirstLink = false;
      if (current) {
        try {
          signedIn = await linkWithCredential(current, credential);
          wasFirstLink = true;
        } catch (err) {
          if (hasErrorCode(err, "auth/credential-already-in-use")) {
            signedIn = await signInWithCredential(auth, credential);
          } else {
            throw err;
          }
        }
      } else {
        signedIn = await signInWithCredential(auth, credential);
      }

      bumpAuthVersion();

      const resolvedDisplayName =
        providerUser.name ?? signedIn.user.displayName ?? null;
      const resolvedPhotoURL =
        providerUser.photo ?? signedIn.user.photoURL ?? null;

      await updateProviderProfile(signedIn.user.uid, {
        displayName: resolvedDisplayName,
        photoURL: resolvedPhotoURL,
      });

      return { wasFirstLink, displayName: resolvedDisplayName };
    } catch (err) {
      if (
        isErrorWithCode(err) &&
        (err.code === statusCodes.SIGN_IN_CANCELLED ||
          err.code === statusCodes.IN_PROGRESS)
      ) {
        return { wasFirstLink: false, displayName: null };
      }
      if (isEmailCollisionError(err)) {
        showAccountExistsToast();
        return { wasFirstLink: false, displayName: null };
      }
      logger.warn("[AuthProvider] signInWithGoogle failed:", err);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }, [bumpAuthVersion, showAccountExistsToast]);

  const signInWithApple = useCallback(async (): Promise<SignInResult> => {
    setIsSigningIn(true);
    try {
      if (!(await AppleAuthentication.isAvailableAsync())) {
        throw new Error(
          "[AuthProvider] Apple Sign In is not available on this device",
        );
      }

      const rawNonceBytes = await Crypto.getRandomBytesAsync(16);
      const rawNonce = bytesToHex(rawNonceBytes);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!result.identityToken) {
        throw new Error("[AuthProvider] Apple response missing identityToken");
      }

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: result.identityToken,
        rawNonce,
      });

      const current = auth.currentUser;
      let signedIn;
      let wasFirstLink = false;
      if (current) {
        try {
          signedIn = await linkWithCredential(current, credential);
          wasFirstLink = true;
        } catch (err) {
          if (hasErrorCode(err, "auth/credential-already-in-use")) {
            signedIn = await signInWithCredential(auth, credential);
          } else {
            throw err;
          }
        }
      } else {
        signedIn = await signInWithCredential(auth, credential);
      }

      bumpAuthVersion();

      // Apple's `fullName` is only returned on the first sign-in for a given
      // Apple ID + bundle ID. Capture it synchronously here — subsequent
      // sign-ins return null and we'd lose it forever.
      const appleDisplayName = formatAppleFullName(result.fullName);
      const resolvedDisplayName =
        appleDisplayName ?? signedIn.user.displayName ?? null;

      await updateProviderProfile(signedIn.user.uid, {
        displayName: resolvedDisplayName,
        photoURL: signedIn.user.photoURL ?? null,
      });

      return { wasFirstLink, displayName: resolvedDisplayName };
    } catch (err) {
      if (
        hasErrorCode(err, "ERR_REQUEST_CANCELED") ||
        hasErrorCode(err, "ERR_REQUEST_CANCELLED")
      ) {
        return { wasFirstLink: false, displayName: null };
      }
      if (isEmailCollisionError(err)) {
        showAccountExistsToast();
        return { wasFirstLink: false, displayName: null };
      }
      logger.warn("[AuthProvider] signInWithApple failed:", err);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }, [bumpAuthVersion, showAccountExistsToast]);

  const signOut = useCallback(async () => {
    setIsSigningIn(true);
    try {
      try {
        await GoogleSignin.signOut();
      } catch {
        // Best-effort — Google session may already be cleared
      }
      await firebaseSignOut(auth);
      // onAuthStateChanged fires with null → anonymous sign-in resumes
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const updateDisplayName = useCallback(
    async (name: string) => {
      const current = auth.currentUser;
      if (!current) {
        throw new Error("[AuthProvider] no user to update");
      }
      await updateDisplayNameService(current.uid, name);
      bumpAuthVersion();
    },
    [bumpAuthVersion],
  );

  const reauthenticate = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) throw new Error("[AuthProvider] no user to reauthenticate");

    const providerId = current.providerData[0]?.providerId;

    if (providerId === "google.com") {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        throw new Error("[AuthProvider] Google reauth cancelled");
      }
      const { idToken } = response.data;
      if (!idToken) {
        throw new Error("[AuthProvider] Google reauth missing idToken");
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await reauthenticateWithCredential(current, credential);
      return;
    }

    if (providerId === "apple.com" && IS_IOS) {
      const rawNonceBytes = await Crypto.getRandomBytesAsync(16);
      const rawNonce = bytesToHex(rawNonceBytes);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const appleResult = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!appleResult.identityToken) {
        throw new Error("[AuthProvider] Apple reauth missing identityToken");
      }
      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: appleResult.identityToken,
        rawNonce,
      });
      await reauthenticateWithCredential(current, credential);
      return;
    }

    throw new Error(
      `[AuthProvider] reauthenticate not supported for provider ${providerId}`,
    );
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return;

    if (!current.isAnonymous) {
      await reauthenticate();
    }

    // Drop the offline replay queue — those queued rows carry the old uid
    // and would be rejected by Firestore rules under the new anon user.
    // Lifetime stats + recent games are device-local per INFRASTRUCTURE.md
    // §17.2 and intentionally survive sign-out / delete.
    await clearPendingResults();

    // Firestore cascade — must succeed while still authed (rules require
    // request.auth.uid == uid for the deletes).
    await deleteUserData(current.uid);

    // Auth account last — onAuthStateChanged then issues a fresh anon user.
    await current.delete();
  }, [reauthenticate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      uid: user?.uid ?? null,
      isAnonymous: user?.isAnonymous ?? true,
      isAuthenticating,
      isSigningIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      updateDisplayName,
      deleteAccount,
      bumpAuthVersion,
    }),
    [
      user,
      authVersion,
      isAuthenticating,
      isSigningIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      updateDisplayName,
      deleteAccount,
      bumpAuthVersion,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};
