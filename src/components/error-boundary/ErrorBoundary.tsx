import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { GLOBAL_COLORS } from "@/src/constants";
import { logger } from "@/src/helpers/logger";
import ka from "@/src/locales/ka.json";

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
    backgroundColor: GLOBAL_COLORS.mixedColors.cream,
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 22,
    color: GLOBAL_COLORS.mixedColors.darkCoffeeThird,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: GLOBAL_COLORS.mixedColors.darkCoffeeSecond,
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    backgroundColor: GLOBAL_COLORS.mixedColors.darkCoffee,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: "gf-aisi-bold-italic",
    fontSize: 16,
    color: GLOBAL_COLORS.primaryColors.white,
  },
});

export default ErrorBoundary;
