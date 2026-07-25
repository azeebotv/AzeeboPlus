import { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { colors } from '@azeebo/design-tokens';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent
          onRetry={this.handleRetry}
          errorMessage={__DEV__ ? this.state.error?.message : undefined}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorBoundaryContent({
  onRetry,
  errorMessage,
}: {
  onRetry: () => void;
  errorMessage?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? colors.dark[900] : colors.light[50] }]}
    >
      <Text style={[styles.title, { color: isDark ? colors.dark[100] : colors.light[900] }]}>
        Something went wrong
      </Text>
      <Text style={[styles.message, { color: isDark ? colors.dark[400] : colors.light[600] }]}>
        {errorMessage || 'An unexpected error occurred'}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary[600] }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try Again"
      >
        <Text style={[styles.buttonText, { color: colors.light[50] }]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
