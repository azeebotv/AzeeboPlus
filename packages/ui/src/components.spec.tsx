import { render } from '@testing-library/react-native';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  SuccessState,
  NoInternetState,
  PaymentFailureState,
  ContentUnavailableState,
  ModerationRemovedState,
  LockedPremiumState,
  FirstTimeState,
} from './components';

describe('UI Components', () => {
  it('LoadingState should render with default title', () => {
    const { getByText } = render(<LoadingState />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('ErrorState should render with message and retry button', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorState description="Test error" onButtonPress={onRetry} />);
    expect(getByText('Test error')).toBeTruthy();
  });

  it('EmptyState should render with title', () => {
    const { getByText } = render(<EmptyState title="No items" />);
    expect(getByText('No items')).toBeTruthy();
  });

  it('SuccessState should render with default title', () => {
    const { getByText } = render(<SuccessState />);
    expect(getByText('Success!')).toBeTruthy();
  });

  it('NoInternetState should render with default title', () => {
    const { getByText } = render(<NoInternetState />);
    expect(getByText('No Internet Connection')).toBeTruthy();
  });

  it('PaymentFailureState should render with default title', () => {
    const { getByText } = render(<PaymentFailureState />);
    expect(getByText('Payment Failed')).toBeTruthy();
  });

  it('ContentUnavailableState should render with default title', () => {
    const { getByText } = render(<ContentUnavailableState />);
    expect(getByText('Content Unavailable')).toBeTruthy();
  });

  it('ModerationRemovedState should render with default title', () => {
    const { getByText } = render(<ModerationRemovedState />);
    expect(getByText('Content Removed')).toBeTruthy();
  });

  it('LockedPremiumState should render with default title', () => {
    const { getByText } = render(<LockedPremiumState />);
    expect(getByText('Premium Content')).toBeTruthy();
  });

  it('FirstTimeState should render with default title', () => {
    const { getByText } = render(<FirstTimeState />);
    expect(getByText('Welcome!')).toBeTruthy();
  });
});
