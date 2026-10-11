'use client';

import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark' as const, label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system' as const, label: 'System', icon: <Laptop className="w-4 h-4" /> },
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
              ? 'bg-az-flame text-az-ink'
              : 'bg-az-glass-card text-az-ink/70 hover:bg-az-ink/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`Switch to ${option.label} theme`}
          aria-pressed={theme === option.value}
        >
          {option.icon}
          <span>{option.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
