# Other Apps Peek Carousel

**Date:** 2026-10-14
**Status:** Implemented, owner-approved and verified on iOS and Android
**Screen:** `StartGameScreen`

## Goal

Add a small, permanent discovery section for the owner's other apps without
interrupting the quiz flow or presenting the content as advertising. The
section promotes Krossi and Drosha through explicit, user-initiated taps.

## Approved visual direction

Use the approved **Peek carousel** composition:

- Place the section below the difficulty ring and above the bottom tab bar.
- Show the Krossi card fully and a visible portion of the Drosha card so the
  horizontal gesture is self-evident.
- Use the existing bronze, parchment, typography, radius, spacing and shadow
  tokens. Do not introduce a second visual system.
- Keep the section visually subordinate to the start-game control.
- Section title: localized equivalent of “Our other apps”.
- Each card contains the official app icon, app name, one short localized
  description and a compact circular arrow action. The earlier text action
  (“Get” / „ჩამოტვირთვა“) was removed after device review because it crowded
  the card on small screens.

## Interaction

- Render the cards in a horizontal `FlatList` or `ScrollView` with native
  scrolling and no automatic motion.
- Tapping anywhere on a card opens that app's platform-specific store page.
- Use `Pressable` with immediate opacity/elevation feedback and no layout shift.
- Keep tap targets at least 44 pt on iOS and 48 dp on Android.
- Provide accessibility role, app-specific label and hint for every card.
- A store-opening failure must fail safely without breaking the home screen.

## Component boundary

Create a reusable `OtherAppsCarousel` component under `src/components/` and
export it from the shared component barrel. Keep app metadata in one typed,
read-only collection rather than duplicating markup or URLs in the screen.

`StartGameScreen` owns only placement. The component owns rendering, scrolling
and store-link selection.

## Layout and responsiveness

- Preserve the current full-screen background, overlay and difficulty ring.
- Convert the main content area to a vertical layout that reserves space for
  both the ring and carousel; never position the carousel over the tab bar.
- Calculate card width from the viewport so one complete card plus part of the
  next card remains visible on supported phone sizes.
- On very short screens, reduce vertical gaps before shrinking content. Do not
  make text or touch targets inaccessible.
- Keep the bottom tab bar at a usable minimum height on short iPhones so its
  labels remain fully visible below the carousel.
- Validate on a small phone, the current iPhone 17 Pro simulator and Android.
- Dark mode uses the existing theme tokens and must retain readable contrast.

## Assets and localization

- Bundle the official Krossi and Drosha icons as local assets; no network image
  dependency is introduced.
- Add Georgian and English translation keys for the section title, descriptions
  and accessibility labels.
- App brand names remain `Krossi` and `Drosha` in both languages.

## Store-policy constraints, analytics and scope

- Record a lightweight existing analytics event when a card is tapped, with the
  selected app and current platform as parameters, if the existing analytics
  helper supports custom events without new infrastructure.
- No modal, notification campaign, remote configuration, dismissal state,
  impression tracking or third-party ad SDK is included.
- Keep this as a clearly labelled “Our other apps” section on the main menu and
  separate from gameplay. Google Play explicitly permits that form of
  first-party cross-promotion without the “Contains ads” declaration; a banner,
  widget, interstitial or placement embedded in gameplay would instead count as
  a house ad. Source: <https://support.google.com/googleplay/android-developer/answer/9859455>.
- Apple permits displaying the developer's own apps as long as the host app is
  not merely a catalogue and access to its functionality is not conditional on
  downloading another app. Source: <https://developer.apple.com/app-store/review/guidelines/>.

## Verification

- Type-check passed; all 9 test suites and 40 tests passed; changed source files
  passed ESLint.
- iPhone SE (3rd generation, iOS 26.5 simulator): card layout, next-card peek,
  and full bottom-tab labels verified after applying the tab-bar minimum height.
- Pixel 9 (Android 15 emulator): AVD data wiped, current debug build installed
  from scratch, carousel rendered correctly, Drosha card reviewed, all four tab
  labels visible, and the card opened its Google Play destination.
- Drosha's gradient body now stretches to the full equalized card height; the
  empty bordered tail seen in the first device review is resolved.
- Store navigation remains user-initiated; no automatic redirect, modal, ad SDK
  or impression tracking was added.

## Documentation impact

Adding and exporting `OtherAppsCarousel` requires updating `INFRASTRUCTURE.md`
component documentation in the same eventual commit. README and `bigChanges.md`
do not need changes.
