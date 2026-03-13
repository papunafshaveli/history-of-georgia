type ColorScheme = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  overlay: string;
  white: string;
  overlayLight: string;
  correctBg: string;
  correctBorder: string;
  incorrectBg: string;
  incorrectBorder: string;
  parchment: string;
  parchmentAlt: string;
  dark: string;
  light: string;
  border: string;
  coffee: string;
  coffeeLight: string;
  coffeeMedium: string;
  coffeeDark: string;
  muted: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  headerBg: string;
  onImage: string;
  transparent: string;
};

export const lightColors: ColorScheme = {
  // Brand
  primary: "#A31D1D",
  accent: "#ED2B2A",
  white: "#FFFFFF",

  // Surfaces
  background: "#FBF3E3",
  surface: "#FFFFFF",
  surfaceAlt: "#ECE4D5",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.2)",

  // Answer feedback
  correctBg: "#DCECD5",
  correctBorder: "#469663",
  incorrectBg: "#FDDEDE",
  incorrectBorder: "#964646",

  // Parchment / old-roll
  parchment: "#fbc67f",
  parchmentAlt: "#debb92",

  // Neutrals
  dark: "#2C2C2C",
  light: "#FBF9FA",
  border: "#DDE6ED",

  // Coffee palette
  coffee: "#AF8260",
  coffeeLight: "#E4C59E",
  coffeeMedium: "#A38474",
  coffeeDark: "#6c5443",
  muted: "#C8BFB0",

  // Gradients
  gradientStart: "#b9976e",
  gradientMid: "#d8c2aa",
  gradientEnd: "#b9976e",

  // Chrome & image overlays
  headerBg: "#2C2C2C",
  onImage: "#2C2C2C",

  // Transparent
  transparent: "transparent",
};

export const darkColors: ColorScheme = {
  // Brand
  primary: "#B82525",
  accent: "#F04040",
  white: "#FFFFFF",

  // Surfaces — warm dark browns (not cold grays) to match parchment images
  background: "#1A1510",
  surface: "#262018",
  surfaceAlt: "#332B22",
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.4)",

  // Answer feedback
  correctBg: "#1A2B1A",
  correctBorder: "#5AAE78",
  incorrectBg: "#2B1A1A",
  incorrectBorder: "#C86060",

  // Parchment — kept close to light theme since parchment images don't change
  parchment: "#C4A868",
  parchmentAlt: "#B49858",

  // Neutrals
  dark: "#EDE5D8",
  light: "#1A1510",
  border: "#4A3E32",

  // Coffee palette — warm tones to complement fixed parchment images
  coffee: "#C89870",
  coffeeLight: "#DDB888",
  coffeeMedium: "#B08A76",
  coffeeDark: "#D4BCA6",
  muted: "#7A7068",

  // Gradients
  gradientStart: "#5A4830",
  gradientMid: "#6E5C46",
  gradientEnd: "#5A4830",

  // Chrome & image overlays — stay dark regardless of theme
  headerBg: "#131010",
  onImage: "#3A2E22",

  // Transparent
  transparent: "transparent",
};
