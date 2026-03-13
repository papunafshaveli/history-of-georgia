import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { lightTheme } from "@/src/theme";
import { logger } from "@/src/helpers/logger";
import ka from "@/src/locales/ka.json";
import { getAdjustedHeight, getAdjustedWidth } from "@/src/helpers";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{ka.error_something_went_wrong}</Text>
          <Text style={styles.subtitle}>{ka.error_please_try_again}</Text>
          <Pressable style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>{ka.game_retry}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.background,
    paddingHorizontal: getAdjustedWidth(32),
    gap: getAdjustedHeight(12),
  },
  title: {
    fontFamily: lightTheme.fonts.accent,
    fontSize: 22,
    color: lightTheme.colors.coffeeDark,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: lightTheme.colors.coffeeMedium,
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    backgroundColor: lightTheme.colors.coffee,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: lightTheme.borderRadius.md,
  },
  buttonText: {
    fontFamily: lightTheme.fonts.accent,
    fontSize: 16,
    color: lightTheme.colors.surface,
  },
});

export default ErrorBoundary;
