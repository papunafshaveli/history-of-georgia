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
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

import { auth } from "@/firebase";
import { IS_IOS } from "@/src/constants/platform";
import { logger } from "@/src/helpers/logger";
import { showToast } from "@/src/helpers/showToast";
import {
  retagPushToken,
  unregisterNotifications,
} from "@/src/helpers/notifications";
import {
  ensureUserDoc,
  touchLastSeen,
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

  const [, , googlePromptAsync] = Google.useAuthRequest({
    androidClientId:
      "394970199474-ig4qafdumg2utm0lbifdfinig6vdo7o2.apps.googleusercontent.com",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

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

        // Refresh users/{uid}.lastSeenAt (throttled to once per 7 days per
        // device). Drives the 180-day inactive-user cleanup; see
        // INFRASTRUCTURE.md §17.3. Fire-and-forget — failure just means the
        // refresh retries on next app open.
        touchLastSeen(next.uid).catch((err) => {
          logger.warn("[AuthProvider] touchLastSeen failed:", err);
        });

        // Keep the device's push_tokens/{token} doc tagged with the
        // current uid so the cleanup cascade can find and delete it. No-op
        // when the user hasn't registered for push, OR when the token is
        // already tagged with this uid.
        retagPushToken(next.uid).catch((err) => {
          logger.warn("[AuthProvider] retagPushToken failed:", err);
        });

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
      const result = await googlePromptAsync();

      if (result?.type !== "success") {
        return { wasFirstLink: false, displayName: null };
      }

      const idToken =
        result.authentication?.idToken ?? result.params?.id_token;
      if (!idToken) {
        throw new Error("[AuthProvider] Google response missing id_token");
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

      const resolvedDisplayName = signedIn.user.displayName ?? null;
      const resolvedPhotoURL = signedIn.user.photoURL ?? null;

      try {
        await updateProviderProfile(signedIn.user.uid, {
          displayName: resolvedDisplayName,
          photoURL: resolvedPhotoURL,
        });
      } catch (profileErr) {
        logger.warn(
          "[AuthProvider] updateProviderProfile failed (Google):",
          profileErr,
        );
      }

      return { wasFirstLink, displayName: resolvedDisplayName };
    } catch (err) {
      if (isEmailCollisionError(err)) {
        showAccountExistsToast();
        return { wasFirstLink: false, displayName: null };
      }
      logger.warn("[AuthProvider] signInWithGoogle failed:", err);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }, [bumpAuthVersion, googlePromptAsync, showAccountExistsToast]);

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

      // Best-effort profile sync — see Google flow above for rationale.
      try {
        await updateProviderProfile(signedIn.user.uid, {
          displayName: resolvedDisplayName,
          photoURL: signedIn.user.photoURL ?? null,
        });
      } catch (profileErr) {
        logger.warn(
          "[AuthProvider] updateProviderProfile failed (Apple):",
          profileErr,
        );
      }

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
      const result = await googlePromptAsync();
      if (result?.type !== "success") {
        throw new Error("[AuthProvider] Google reauth cancelled");
      }
      const idToken =
        result.authentication?.idToken ?? result.params?.id_token;
      if (!idToken) {
        throw new Error("[AuthProvider] Google reauth missing id_token");
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
  }, [googlePromptAsync]);

  const deleteAccount = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return;

    if (!current.isAnonymous) {
      await reauthenticate();
    }

    // Order matters here. Each step must succeed before the next, and
    // irreversible local cleanup runs LAST so a partial failure leaves
    // the user with their offline queue intact and the account in a
    // retryable state.
    //
    // 1. Firestore cascade — must succeed while still authed (rules
    //    require request.auth.uid == uid for the deletes). Idempotent:
    //    safe to retry against an already-deleted doc.
    await deleteUserData(current.uid);

    // 2. Drop the device's push_tokens/{token} doc so the deleted
    //    account stops receiving notifications addressed to it. Needs
    //    auth (rule requires owner uid match), so it must run before
    //    `current.delete()` invalidates the credentials.
    await unregisterNotifications();

    // 3. Auth account — onAuthStateChanged then issues a fresh anon user.
    await current.delete();

    // 4. Pending-results queue is local-only AsyncStorage — clear it
    //    AFTER the server-side delete succeeds. If steps 1–3 failed,
    //    the queue is preserved and a retry can still flush legitimate
    //    offline games against the not-yet-deleted account. After step
    //    3 succeeds, queued rows would be dropped by the replay path
    //    anyway (uid mismatch with the new anon user), but explicitly
    //    clearing avoids the dropped-replay log noise. Lifetime stats
    //    + recent games are device-local per INFRASTRUCTURE.md §17.2
    //    and intentionally survive sign-out / delete.
    await clearPendingResults();
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
