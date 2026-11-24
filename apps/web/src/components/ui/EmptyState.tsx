'use client';

import {
  Search,
  Film,
  Tv,
  Music,
  Gamepad2,
  Trophy,
  Ticket,
  DollarSign,
  Wallet,
  CreditCard,
  Gift,
  Bell,
  MessageCircle,
  Users,
  Shield,
  Clock,
  Activity,
  BarChart3,
  Settings,
  AlertTriangle,
  Package,
  Heart,
  PlayCircle,
  Eye,
  BookOpen,
  Star,
  Zap,
  Inbox,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  search: Search,
  film: Film,
  tv: Tv,
  music: Music,
  gamepad: Gamepad2,
  trophy: Trophy,
  ticket: Ticket,
  dollar: DollarSign,
  wallet: Wallet,
  creditCard: CreditCard,
  gift: Gift,
  bell: Bell,
  message: MessageCircle,
  users: Users,
  shield: Shield,
  clock: Clock,
  activity: Activity,
  barChart: BarChart3,
  settings: Settings,
  alert: AlertTriangle,
  package: Package,
  heart: Heart,
  play: PlayCircle,
  eye: Eye,
  book: BookOpen,
  star: Star,
  zap: Zap,
  inbox: Inbox,
};

// Map common emoji/word descriptions to icon names
const EMOJI_TO_ICON: Record<string, string> = {
  Mailbox: 'inbox',
  DollarSign: 'dollar',
  Search: 'search',
  Film: 'film',
  Tv: 'tv',
  Music2: 'music',
  Gamepad2: 'gamepad',
  Trophy: 'trophy',
  Ticket: 'ticket',
  CreditCard: 'creditCard',
  Gift: 'gift',
  Bell: 'bell',
  MessageCircle: 'message',
  Users: 'users',
  Shield: 'shield',
  Timer: 'clock',
  BarChart3: 'barChart',
  Settings: 'settings',
  AlertTriangle: 'alert',
  Package: 'package',
  Heart: 'heart',
  '▶': 'play',
  Eye: 'eye',
  BookOpen: 'book',
  Star: 'star',
  Zap: 'zap',
  Bot: 'inbox',
  Banknote: 'dollar',
  Lock: 'shield',
  ClipboardList: 'barChart',
  Theater: 'inbox',
  Globe: 'inbox',
  Flame: 'zap',
  Gem: 'zap',
  FileText: 'book',
  Trash2: 'package',
  Pencil: 'book',
  X: 'alert',
  CheckCircle: 'activity',
  RefreshCw: 'clock',
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  dark?: boolean;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  dark = false,
  className = '',
}: EmptyStateProps) {
  const titleColor = dark ? 'text-az-ink' : 'text-az-ink';
  const descColor = dark ? 'text-az-ink/50' : 'text-az-ink-muted';
  const iconColor = dark ? 'text-az-ink/30' : 'text-az-ink-dim';

  // Resolve icon: emoji -> icon name -> Lucide component
  const iconName = EMOJI_TO_ICON[icon] || ICON_MAP[icon] ? icon : EMOJI_TO_ICON[icon] || 'inbox';
  const IconComponent = ICON_MAP[iconName] || Inbox;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <IconComponent
        className={`w-12 h-12 mb-4 ${iconColor}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h3 className={`az-title ${titleColor} mb-2`}>{title}</h3>
      <p className={`az-lead ${descColor} max-w-md mb-6`}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="az-btn-primary az-btn-primary--inline focus:outline-none focus:ring-2 focus:ring-az-flame"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
