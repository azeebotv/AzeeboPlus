import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Button,
  Card,
  Badge,
  Avatar,
  Skeleton,
  ContentCard,
  HeroCard,
  Divider,
  ProgressBar,
  Chip,
  Spinner,
  ErrorState,
} from './web-components';

jest.mock('@azeebo/design-tokens', () => ({
  colors: {
    primary: { 500: '#7c3aed' },
    dark: { 300: '#6b7280', 600: '#374151', 700: '#1f2937', 800: '#111827', 900: '#030712' },
  },
}));

jest.mock('lucide-react', () => {
  const MockIcon = (props: React.SVGAttributes<SVGElement>) => (
    <svg data-testid="mock-icon" {...props} />
  );
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          const Icon = Object.assign(MockIcon, { displayName: prop });
          return Icon;
        }
        return undefined;
      },
    }
  );
});

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows loading text when isLoading', () => {
    render(
      <Button isLoading loadingText="Please wait">
        Submit
      </Button>
    );
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('shows default loading text', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with aria-label', () => {
    render(<Button aria-label="Submit form">Go</Button>);
    expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument();
  });

  it('defaults type to button', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepts custom type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Card onClick={onClick}>Clickable card</Card>);
    await user.click(screen.getByText('Clickable card'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has tabIndex 0 when onClick is provided', () => {
    render(<Card onClick={() => {}}>Clickable</Card>);
    expect(screen.getByText('Clickable')).toHaveAttribute('tabindex', '0');
  });

  it('accepts custom role', () => {
    render(<Card role="article">Content</Card>);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('accepts aria-label', () => {
    render(<Card aria-label="User profile card">Content</Card>);
    expect(screen.getByLabelText('User profile card')).toBeInTheDocument();
  });

  it('accepts aria-describedby', () => {
    render(
      <>
        <Card aria-describedby="desc">Described content</Card>
        <div id="desc">Description</div>
      </>
    );
    expect(screen.getByText('Described content')).toHaveAttribute('aria-describedby', 'desc');
  });

  it('supports custom component via as prop', () => {
    render(
      <Card as="section" role="region" aria-label="Test">
        Content
      </Card>
    );
    expect(screen.getByRole('region', { name: 'Test' })).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders as span when no onClick', () => {
    const { container } = render(<Badge>Tag</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
  });

  it('renders as button when onClick is provided', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Badge onClick={onClick}>Clickable badge</Badge>);
    await user.click(screen.getByRole('button', { name: 'Clickable badge' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts custom role', () => {
    render(<Badge role="status">Status</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('accepts aria-label', () => {
    render(<Badge aria-label="Notification count">5</Badge>);
    expect(screen.getByLabelText('Notification count')).toBeInTheDocument();
  });
});

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="/avatar.jpg" alt="User photo" />);
    const imgs = screen.getAllByRole('img', { name: 'User photo' });
    expect(imgs.length).toBeGreaterThan(0);
  });

  it('shows fallback initials for single name', () => {
    render(<Avatar fallback="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('shows fallback initials for two names', () => {
    render(<Avatar fallback="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows question mark when no fallback', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('truncates to 2 characters for long names', () => {
    render(<Avatar fallback="John Michael Doe" />);
    expect(screen.getByText('JM')).toBeInTheDocument();
  });

  it('uses alt as aria-label when provided', () => {
    render(<Avatar src="/img.jpg" alt="Profile" />);
    const imgs = screen.getAllByRole('img', { name: 'Profile' });
    expect(imgs.length).toBeGreaterThan(0);
  });

  it('uses fallback as aria-label when no alt', () => {
    render(<Avatar fallback="Jane Smith" />);
    expect(screen.getByRole('img', { name: 'Jane Smith' })).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<Avatar icon={<span data-testid="custom-icon">!</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<Avatar fallback="A" status="online" />);
    expect(screen.getByRole('status', { name: 'online' })).toBeInTheDocument();
  });

  it('shows offline status indicator', () => {
    render(<Avatar fallback="A" status="offline" />);
    expect(screen.getByRole('status', { name: 'offline' })).toBeInTheDocument();
  });

  it('shows away status indicator', () => {
    render(<Avatar fallback="A" status="away" />);
    expect(screen.getByRole('status', { name: 'away' })).toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('progressbar');
    expect(skeleton).toBeInTheDocument();
  });

  it('has aria-busy true', () => {
    render(<Skeleton />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
  });

  it('has aria-label Loading', () => {
    render(<Skeleton />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies custom width', () => {
    render(<Skeleton width="200px" />);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '200px' } as any);
  });

  it('applies custom height', () => {
    render(<Skeleton height="40px" />);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(screen.getByRole('progressbar')).toHaveStyle({ height: '40px' } as any);
  });

  it('applies custom border radius', () => {
    render(<Skeleton borderRadius="50%" />);
    expect(screen.getByRole('progressbar')).toHaveStyle({ borderRadius: '50%' });
  });

  it('accepts custom role', () => {
    render(<Skeleton role="status" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('ContentCard', () => {
  it('renders title', () => {
    render(<ContentCard title="My Show" thumbnail="/thumb.jpg" universe="reality" />);
    expect(screen.getByText('My Show')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ContentCard
        title="My Show"
        description="A great show"
        thumbnail="/thumb.jpg"
        universe="reality"
      />
    );
    expect(screen.getByText('A great show')).toBeInTheDocument();
  });

  it('renders universe badge', () => {
    render(<ContentCard title="My Show" thumbnail="/thumb.jpg" universe="reality" />);
    expect(screen.getByText('Reality')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <ContentCard title="My Show" thumbnail="/thumb.jpg" universe="reality" onClick={onClick} />
    );
    await user.click(screen.getByRole('article', { name: 'My Show' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders premium badge when isPremium', () => {
    render(<ContentCard title="My Show" thumbnail="/thumb.jpg" universe="reality" isPremium />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('does not render premium badge by default', () => {
    render(<ContentCard title="My Show" thumbnail="/thumb.jpg" universe="reality" />);
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });
});

describe('HeroCard', () => {
  it('renders title', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
      />
    );
    expect(screen.getByText('Big Show')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
      />
    );
    expect(screen.getByText('Season 2')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
      />
    );
    expect(screen.getByText('Epic content')).toBeInTheDocument();
  });

  it('renders universe badge', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
      />
    );
    expect(screen.getByText('Reality')).toBeInTheDocument();
  });

  it('has play button with accessible label', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
      />
    );
    expect(screen.getByRole('button', { name: 'Play Big Show' })).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', async () => {
    const user = userEvent.setup();
    const onPlay = jest.fn();
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
        onPlay={onPlay}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Big Show' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('renders live badge when isLive', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
        isLive
      />
    );
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('renders premium badge when isPremium', () => {
    render(
      <HeroCard
        title="Big Show"
        subtitle="Season 2"
        description="Epic content"
        thumbnail="/thumb.jpg"
        universe="reality"
        isPremium
      />
    );
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });
});

describe('Divider', () => {
  it('renders as separator by default', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('accepts custom role', () => {
    render(<Divider role="presentation" />);
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('has horizontal aria-orientation by default', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('has vertical aria-orientation when set', () => {
    render(<Divider orientation="vertical" aria-orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});

describe('ProgressBar', () => {
  it('renders progressbar role', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets aria-valuenow', () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('sets aria-valuemin to 0', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
  });

  it('sets aria-valuemax to 100 by default', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('supports custom max value', () => {
    render(<ProgressBar value={5} max={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');
  });

  it('renders label when provided', () => {
    render(<ProgressBar value={50} label="Upload progress" />);
    expect(screen.getByText('Upload progress')).toBeInTheDocument();
  });

  it('shows percentage label when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('caps percentage at 100% when value exceeds max', () => {
    render(<ProgressBar value={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('Chip', () => {
  it('renders label', () => {
    render(<Chip label="React" />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders remove button when onRemove is provided', () => {
    render(<Chip label="Tag" onRemove={() => {}} />);
    expect(screen.getByRole('button', { name: 'Remove Tag' })).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    render(<Chip label="Tag" onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Remove Tag' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render remove button by default', () => {
    render(<Chip label="Tag" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('renders with role=status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label Loading', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders as SVG element', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders default title', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders default description', () => {
    render(<ErrorState />);
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState title="Custom error" />);
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<ErrorState description="Custom desc" />);
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
  });

  it('renders retry button when onButtonPress is provided', () => {
    render(<ErrorState onButtonPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('does not render retry button by default', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onButtonPress when retry is clicked', async () => {
    const user = userEvent.setup();
    const onButtonPress = jest.fn();
    render(<ErrorState onButtonPress={onButtonPress} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onButtonPress).toHaveBeenCalledTimes(1);
  });

  it('renders custom button text', () => {
    render(<ErrorState buttonText="Try Again" onButtonPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});
