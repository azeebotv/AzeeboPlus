'use client';

import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'system' as const, label: 'System', icon: '💻' },
  ];

  return (
    <div className="flex items-center gap-2">
      {options.map((option) => (
        <motion.button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === option.value
              ? 'bg-[var(--brand-orange)] text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`Switch to ${option.label} theme`}
          aria-pressed={theme === option.value}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
