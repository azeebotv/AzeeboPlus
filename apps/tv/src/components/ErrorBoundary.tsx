import { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, tvTypography } from '../theme';

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

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={4}>
            {__DEV__ && this.state.error ? this.state.error.message : 'Please restart the app'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 64,
  },
  title: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.bold,
    marginBottom: 16,
  },
  message: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    textAlign: 'center',
  },
});
