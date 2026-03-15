type ColorScheme = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceRaised: string;
  surfaceSunken: string;
  overlay: string;
  white: string;
  overlayLight: string;
  correctBg: string;
  correctBorder: string;
  incorrectBg: string;
  incorrectBorder: string;
  parchment: string;
  parchmentAlt: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  disabled: string;
  disabledBorder: string;
  bronze: string;
  bronzeLight: string;
  bronzeMid: string;
  bronzeDark: string;
  uiMuted: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  parchmentTint: string;
  parchmentDivider: string;
  parchmentFrost: string;
  parchmentBorderLight: string;
  darkTint: string;
  cardShadow: string;
  chromeBg: string;
  onImage: string;
  transparent: string;
  ringBand: string;
  ringEdge: string;
  ringActive: string;
  ringTextActive: string;
};

export const lightColors: ColorScheme = {
  // Brand
  primary: "#8F1E1E",
  accent: "#D14B2E",
  white: "#FFFFFF",

  // Surfaces
  background: "#F7EFE4",
  surface: "#FFF9F0",
  surfaceAlt: "#EFE1D1",
  surfaceRaised: "#FFFCF6",
  surfaceSunken: "#E8D7C5",
  overlay: "rgba(17, 12, 7, 0.55)",
  overlayLight: "rgba(17, 12, 7, 0.2)",

  // Answer feedback
  correctBg: "#D7EFE0",
  correctBorder: "#3F8F63",
  incorrectBg: "#F7DADA",
  incorrectBorder: "#B85A5A",

  // Parchment / old-roll
  parchment: "#E9C78F",
  parchmentAlt: "#D8B27E",

  // Neutrals
  text: "#2C241B",
  textMuted: "#7F6D5F",
  textOnPrimary: "#FFF6ED",
  border: "#D7C7B6",
  disabled: "#E9DECF",
  disabledBorder: "#D2C1B0",

  // Bronze palette
  bronze: "#B07A52",
  bronzeLight: "#E9C39A",
  bronzeMid: "#A37B62",
  bronzeDark: "#6D4B36",
  uiMuted: "#B7A392",

  // Gradients
  gradientStart: "#D4B894",
  gradientMid: "#EAD8C2",
  gradientEnd: "#C9A881",

  // Parchment overlays (same both themes — parchment images don't change)
  parchmentTint: "rgba(0, 0, 0, 0.06)",
  parchmentDivider: "rgba(0, 0, 0, 0.12)",
  parchmentFrost: "rgba(255, 255, 255, 0.35)",
  parchmentBorderLight: "rgba(0, 0, 0, 0.1)",
  darkTint: "transparent",
  cardShadow: "rgba(62, 45, 3, 0.12)",

  // Chrome & image overlays
  chromeBg: "#7A5C46",
  onImage: "#2B221A",

  // Transparent
  transparent: "transparent",

  // Difficulty ring
  ringBand: "#8A6B50",
  ringEdge: "#5C4030",
  ringActive: "#A8855F",
  ringTextActive: "#F5D9A8",
};

export const darkColors: ColorScheme = {
  // Brand
  primary: "#C23A3A",
  accent: "#E25B3B",
  white: "#FFFFFF",

  // Surfaces — warm dark browns (not cold grays) to match parchment images
  background: "#15110D",
  surface: "#241C15",
  surfaceAlt: "#30261D",
  surfaceRaised: "#382C22",
  surfaceSunken: "#1B1510",
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.35)",

  // Answer feedback
  correctBg: "#1A2E22",
  correctBorder: "#5DB47C",
  incorrectBg: "#2E1A1A",
  incorrectBorder: "#D17373",

  // Parchment — kept close to light theme since parchment images don't change
  parchment: "#C6A96C",
  parchmentAlt: "#B7955B",

  // Neutrals
  text: "#F1E7D9",
  textMuted: "#B3A08F",
  textOnPrimary: "#FFF3E8",
  border: "#5B4D3E",
  disabled: "#2B221A",
  disabledBorder: "#3A2F26",

  // Bronze palette — warm tones to complement fixed parchment images
  bronze: "#CD996E",
  bronzeLight: "#F0C99E",
  bronzeMid: "#C09574",
  bronzeDark: "#EBD4BA",
  uiMuted: "#B29C88",

  // Gradients
  gradientStart: "#5A4635",
  gradientMid: "#6B5643",
  gradientEnd: "#513E30",

  // Parchment overlays
  parchmentTint: "rgba(0, 0, 0, 0.06)",
  parchmentDivider: "rgba(0, 0, 0, 0.12)",
  parchmentFrost: "rgba(255, 255, 255, 0.25)",
  parchmentBorderLight: "rgba(0, 0, 0, 0.1)",
  darkTint: "rgba(15, 10, 5, 0.2)",
  cardShadow: "rgba(62, 45, 3, 0.2)",

  // Chrome & image overlays — stay dark regardless of theme
  chromeBg: "#15100C",
  onImage: "#2B221A",

  // Transparent
  transparent: "transparent",

  // Difficulty ring
  ringBand: "#3A2C20",
  ringEdge: "#1A1410",
  ringActive: "#5A4535",
  ringTextActive: "#F5D9A8",
};
