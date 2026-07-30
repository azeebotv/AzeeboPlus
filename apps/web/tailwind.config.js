/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        card: 'var(--dark-900)',
        'card-foreground': 'var(--text-primary)',
        popover: 'var(--dark-800)',
        'popover-foreground': 'var(--text-primary)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--text-primary)',
        secondary: 'var(--bg-secondary)',
        'secondary-foreground': 'var(--text-primary)',
        muted: 'var(--bg-tertiary)',
        'muted-foreground': 'var(--text-secondary)',
        accent: 'var(--primary)',
        'accent-foreground': 'var(--text-primary)',
        destructive: 'var(--error)',
        'destructive-foreground': 'var(--text-primary)',
        border: 'var(--border-default)',
        input: 'var(--bg-tertiary)',
        ring: 'var(--primary)',
      },
    },
  },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}