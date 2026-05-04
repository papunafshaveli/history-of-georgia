# Privacy Policy

**App:** History of Georgia (საქართველოს ისტორია)
**Developer:** Papuna Fshaveli
**Contact:** papunafshaveli@gmail.com
**Effective date:** May 5, 2026

This Privacy Policy describes how the History of Georgia mobile application ("the App") handles information when you use it. By installing or using the App, you agree to this policy.

## 1. Who is responsible for your data

Papuna Fshaveli, an independent developer, is the data controller for the App. You can reach the developer at **papunafshaveli@gmail.com** for any privacy-related question, request, or complaint.

## 2. What data the App collects

### 2.1 When you first open the App

An **anonymous Firebase Authentication account** is created automatically. It is identified by a random user ID (UID) and is not linked to any personal information about you. It is not used to track you across other apps or websites.

### 2.2 If you choose to sign in

You may optionally sign in with Google or Apple to appear on the public leaderboard. If you do:

- **Google Sign-In** — the App receives your name, email address, and profile photo URL from Google.
- **Apple Sign-In** — the App receives your name (only the first time you sign in) and an email address. Apple may provide a private relay email instead of your real one.

The App stores only your display name and (where available) your profile photo URL in its database for the purpose of showing you on the leaderboard. Your email address is held inside Firebase Authentication and is not stored as a separate field.

### 2.3 While you play

The App stores the following game data in **Cloud Firestore** (operated by Google):

- Your display name and profile photo URL (for signed-in users), total points, games played, total correct answers, total questions, best single-game score, weekly points, week start date, and account-creation / last-updated / last-seen timestamps.
- A record of each completed game: score, number of correct answers, total questions, selected difficulty, and timestamp.

The App also stores the following on your device only, using local storage:

- Your settings (sound, vibration, push notifications, theme, language).
- A history of your recent games and lifetime statistics.
- A queue of pending game results that could not be sent while you were offline.

Local data never leaves your device unless and until it is uploaded to Cloud Firestore as part of the data described above.

### 2.4 Push notifications

If you enable push notifications in Settings, the App registers an **Expo push token** for your device and stores it in Cloud Firestore so the developer can deliver notifications to you. The token does not identify you personally outside the App. It is automatically removed when you sign out, delete your account, uninstall the App, or when delivery to your device starts to fail.

### 2.5 What the App does NOT collect

The App does not collect, store, or use any of the following:

- Advertising identifiers (IDFA / GAID) or tracking pixels.
- Third-party analytics or marketing SDKs.
- Crash-reporting data tied to your identity.
- Your location, contacts, photos, microphone, or camera.
- Personal identifiers beyond what Google or Apple provide when you choose to sign in.
- Any information about other apps installed on your device.

The App does not share data with any third party for advertising, marketing, or profiling purposes.

## 3. How the App uses your data

The App uses the data described above only to:

- Authenticate you and let you continue between sessions on the same device or across devices.
- Save your scores and rank you on the leaderboard.
- Show you statistics for your own gameplay.
- Deliver push notifications that you opt in to.
- Operate, maintain, and improve the App.

## 4. Legal basis for processing (EEA / UK)

Where the EU General Data Protection Regulation (GDPR) or the UK GDPR applies, the legal bases for processing your data are:

- **Performance of a contract** — to provide the App's features, including the signed-in account, leaderboard, and saved scores.
- **Consent** — for push notifications. You may withdraw your consent at any time by turning notifications off in Settings.
- **Legitimate interests** — to operate the App safely and prevent abuse (for example, server-side limits on how quickly scores can grow).

## 5. Who else processes your data

The App relies on the following processors. Each operates under its own privacy policy and security practices:

| Processor | Purpose | Privacy policy |
| --- | --- | --- |
| **Google (Firebase Authentication, Cloud Firestore, Cloud Functions)** | Authentication, database, server-side functions | https://policies.google.com/privacy |
| **Google Sign-In** | OAuth provider (only if you choose to sign in with Google) | https://policies.google.com/privacy |
| **Apple (Sign in with Apple, Apple Push Notification service)** | OAuth provider and push delivery on iOS (only if you choose Apple, or opt in to push notifications) | https://www.apple.com/legal/privacy/ |
| **Expo (Expo Application Services)** | Push token issuance, push notification delivery, and over-the-air application updates | https://expo.dev/privacy-explained |

The App does not integrate any other third-party SDKs that collect personal data.

## 6. International data transfers

Firebase, Google Sign-In, Apple, and Expo may store and process data on servers located outside Georgia and outside the European Economic Area, including in the United States. These providers commit to industry-standard safeguards (such as Standard Contractual Clauses) for international data transfers. See each provider's privacy policy for the specific safeguards that apply.

## 7. How long the App keeps your data

- **Local data on your device** is kept until you uninstall the App or clear the App's storage.
- **Anonymous accounts and their game results** are kept until you uninstall the App or delete your account from within the App.
- **Signed-in accounts and their game results** are kept until you delete your account from within the App: **Settings → Account → "Delete account & sign out"**. Deletion removes your authentication record, your user document, your game history, and your registered push tokens.
- **Push tokens** are removed when you sign out, delete your account, uninstall the App, or when the App's server detects the device can no longer be reached.

A future version of the App may automatically remove accounts that have been inactive for an extended period (for example, 180 days). This Privacy Policy will be updated before any such automatic deletion begins.

## 8. Your rights

Depending on where you live, you may have the following rights with respect to your personal data:

- **Access** — ask what data the App holds about you.
- **Rectification** — correct inaccurate data, including your display name (which you can edit in a future version, and which the developer can correct on request in the meantime).
- **Erasure** — delete your data. You can do this yourself, at any time, inside the App: **Settings → Account → "Delete account & sign out"**.
- **Restriction or objection** — limit certain processing.
- **Withdrawal of consent** — turn off push notifications in Settings.
- **Lodge a complaint** with the data-protection authority in your country of residence.

To exercise any of these rights, write to **papunafshaveli@gmail.com**. The developer will respond within a reasonable time and no later than 30 days.

The App does not "sell" or "share" personal information as those terms are defined under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA).

## 9. Children's privacy

The App is **not directed to children under 13**. The App does not knowingly collect personal data from children under 13. If you believe that a child under 13 has provided personal data through the App, please contact **papunafshaveli@gmail.com** and the data will be deleted promptly.

## 10. Security

The App uses HTTPS for all network communication and relies on Google Cloud and Apple security infrastructure. Strict server-side rules (Firestore Security Rules) ensure that each user can only read and write their own data, and that game scores are subject to anti-cheat caps. No system is 100% secure, but the App applies measures appropriate to the kind of data it handles.

## 11. Changes to this policy

This Privacy Policy may be updated from time to time. The "Effective date" at the top will be revised whenever a meaningful change is made. Continued use of the App after a change means you accept the updated policy.

## 12. Contact

For any privacy question, request, or complaint:

**Papuna Fshaveli**
**papunafshaveli@gmail.com**
