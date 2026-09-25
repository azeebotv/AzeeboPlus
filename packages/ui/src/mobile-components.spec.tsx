import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  SuccessState,
  NoInternetState,
  PaymentFailureState,
  ContentUnavailableState,
  ModerationRemovedState,
  LockedPremiumState,
  FirstTimeState,
} from './components';

describe('LoadingState', () => {
  it('renders with default title', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders with custom title', () => {
    render(<LoadingState title="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeTruthy();
  });

  it('has default accessibilityLabel of "Loading"', () => {
    render(<LoadingState />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('uses custom accessibilityLabel when provided', () => {
    render(<LoadingState accessibilityLabel="Loading videos" />);
    expect(screen.getByLabelText('Loading videos')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders with default title and description', () => {
    render(<EmptyState />);
    expect(screen.getByText('No content found')).toBeTruthy();
    expect(screen.getByText("There's nothing to show here yet")).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<EmptyState title="No results" description="Try a different search" />);
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try a different search')).toBeTruthy();
  });

  it('renders with custom icon', () => {
    render(<EmptyState icon="🎬" />);
    expect(screen.getByText('🎬')).toBeTruthy();
  });

  it('renders default icon when none provided', () => {
    render(<EmptyState />);
    expect(screen.getByText('📭')).toBeTruthy();
  });

  it('has default accessibilityLabel of "Empty state"', () => {
    render(<EmptyState />);
    expect(screen.getByLabelText('Empty state')).toBeTruthy();
  });

  it('uses custom accessibilityLabel when provided', () => {
    render(<EmptyState accessibilityLabel="No videos available" />);
    expect(screen.getByLabelText('No videos available')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('renders with default title and description', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Please try again later')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<ErrorState title="Oops" description="Network error" />);
    expect(screen.getByText('Oops')).toBeTruthy();
    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('shows retry button when onButtonPress is provided', () => {
    render(<ErrorState onButtonPress={() => {}} />);
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('does not show retry button when onButtonPress is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('uses custom buttonText', () => {
    render(<ErrorState buttonText="Try Again" onButtonPress={() => {}} />);
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('calls onButtonPress when retry button is tapped', () => {
    const onRetry = jest.fn();
    render(<ErrorState onButtonPress={onRetry} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has default accessibilityLabel of "Error state"', () => {
    render(<ErrorState />);
    expect(screen.getByLabelText('Error state')).toBeTruthy();
  });

  it('uses custom accessibilityLabel when provided', () => {
    render(<ErrorState accessibilityLabel="Connection error" />);
    expect(screen.getByLabelText('Connection error')).toBeTruthy();
  });
});

describe('SuccessState', () => {
  it('renders with default title and description', () => {
    render(<SuccessState />);
    expect(screen.getByText('Success!')).toBeTruthy();
    expect(screen.getByText('Your action was completed successfully')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<SuccessState title="Done" description="All set" />);
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('All set')).toBeTruthy();
  });

  it('shows button when onButtonPress is provided', () => {
    render(<SuccessState onButtonPress={() => {}} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('does not show button when onButtonPress is not provided', () => {
    render(<SuccessState />);
    expect(screen.queryByText('Continue')).toBeNull();
  });

  it('uses custom buttonText', () => {
    render(<SuccessState buttonText="Next" onButtonPress={() => {}} />);
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('calls onButtonPress when button is tapped', () => {
    const onPress = jest.fn();
    render(<SuccessState onButtonPress={onPress} />);
    fireEvent.click(screen.getByText('Continue'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('NoInternetState', () => {
  it('renders with default title and description', () => {
    render(<NoInternetState />);
    expect(screen.getByText('No Internet Connection')).toBeTruthy();
    expect(screen.getByText('Please check your network and try again')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<NoInternetState title="Offline" description="Connect to WiFi" />);
    expect(screen.getByText('Offline')).toBeTruthy();
    expect(screen.getByText('Connect to WiFi')).toBeTruthy();
  });

  it('shows retry button when onButtonPress is provided', () => {
    render(<NoInternetState onButtonPress={() => {}} />);
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('does not show retry button when onButtonPress is not provided', () => {
    render(<NoInternetState />);
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('calls onButtonPress when retry button is tapped', () => {
    const onRetry = jest.fn();
    render(<NoInternetState onButtonPress={onRetry} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentFailureState', () => {
  it('renders with default title and description', () => {
    render(<PaymentFailureState />);
    expect(screen.getByText('Payment Failed')).toBeTruthy();
    expect(screen.getByText('Your payment could not be processed')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<PaymentFailureState title="Card declined" description="Try another card" />);
    expect(screen.getByText('Card declined')).toBeTruthy();
    expect(screen.getByText('Try another card')).toBeTruthy();
  });

  it('shows retry button when onButtonPress is provided', () => {
    render(<PaymentFailureState onButtonPress={() => {}} />);
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('does not show retry button when onButtonPress is not provided', () => {
    render(<PaymentFailureState />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('calls onButtonPress when retry button is tapped', () => {
    const onRetry = jest.fn();
    render(<PaymentFailureState onButtonPress={onRetry} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ContentUnavailableState', () => {
  it('renders with default title and description', () => {
    render(<ContentUnavailableState />);
    expect(screen.getByText('Content Unavailable')).toBeTruthy();
    expect(screen.getByText('This content is no longer available')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<ContentUnavailableState title="Removed" description="Taken down by owner" />);
    expect(screen.getByText('Removed')).toBeTruthy();
    expect(screen.getByText('Taken down by owner')).toBeTruthy();
  });

  it('shows browse button when onButtonPress is provided', () => {
    render(<ContentUnavailableState onButtonPress={() => {}} />);
    expect(screen.getByText('Browse More')).toBeTruthy();
  });

  it('does not show browse button when onButtonPress is not provided', () => {
    render(<ContentUnavailableState />);
    expect(screen.queryByText('Browse More')).toBeNull();
  });

  it('calls onButtonPress when browse button is tapped', () => {
    const onPress = jest.fn();
    render(<ContentUnavailableState onButtonPress={onPress} />);
    fireEvent.click(screen.getByText('Browse More'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ModerationRemovedState', () => {
  it('renders with default title and description', () => {
    render(<ModerationRemovedState />);
    expect(screen.getByText('Content Removed')).toBeTruthy();
    expect(
      screen.getByText('This content has been removed due to community guidelines')
    ).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<ModerationRemovedState title="Taken Down" description="Violates policy" />);
    expect(screen.getByText('Taken Down')).toBeTruthy();
    expect(screen.getByText('Violates policy')).toBeTruthy();
  });

  it('does not render any button', () => {
    render(<ModerationRemovedState />);
    expect(screen.queryByText('Retry')).toBeNull();
    expect(screen.queryByText('Continue')).toBeNull();
  });
});

describe('LockedPremiumState', () => {
  it('renders with default title and description', () => {
    render(<LockedPremiumState />);
    expect(screen.getByText('Premium Content')).toBeTruthy();
    expect(screen.getByText('Upgrade to premium to access this content')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<LockedPremiumState title="Locked" description="Subscribe to unlock" />);
    expect(screen.getByText('Locked')).toBeTruthy();
    expect(screen.getByText('Subscribe to unlock')).toBeTruthy();
  });

  it('shows upgrade button when onButtonPress is provided', () => {
    render(<LockedPremiumState onButtonPress={() => {}} />);
    expect(screen.getByText('Go Premium')).toBeTruthy();
  });

  it('does not show upgrade button when onButtonPress is not provided', () => {
    render(<LockedPremiumState />);
    expect(screen.queryByText('Go Premium')).toBeNull();
  });

  it('uses custom buttonText', () => {
    render(<LockedPremiumState buttonText="Unlock Now" onButtonPress={() => {}} />);
    expect(screen.getByText('Unlock Now')).toBeTruthy();
  });

  it('calls onButtonPress when upgrade button is tapped', () => {
    const onUpgrade = jest.fn();
    render(<LockedPremiumState onButtonPress={onUpgrade} />);
    fireEvent.click(screen.getByText('Go Premium'));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });
});

describe('FirstTimeState', () => {
  it('renders with default title and description', () => {
    render(<FirstTimeState />);
    expect(screen.getByText('Welcome!')).toBeTruthy();
    expect(screen.getByText('Get started by exploring our content')).toBeTruthy();
  });

  it('renders with custom title and description', () => {
    render(<FirstTimeState title="Hey there" description="Let's get started" />);
    expect(screen.getByText('Hey there')).toBeTruthy();
    expect(screen.getByText("Let's get started")).toBeTruthy();
  });

  it('shows explore button when onButtonPress is provided', () => {
    render(<FirstTimeState onButtonPress={() => {}} />);
    expect(screen.getByText('Explore')).toBeTruthy();
  });

  it('does not show explore button when onButtonPress is not provided', () => {
    render(<FirstTimeState />);
    expect(screen.queryByText('Explore')).toBeNull();
  });

  it('uses custom buttonText', () => {
    render(<FirstTimeState buttonText="Get Started" onButtonPress={() => {}} />);
    expect(screen.getByText('Get Started')).toBeTruthy();
  });

  it('calls onButtonPress when explore button is tapped', () => {
    const onExplore = jest.fn();
    render(<FirstTimeState onButtonPress={onExplore} />);
    fireEvent.click(screen.getByText('Explore'));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });
});
