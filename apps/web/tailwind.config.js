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
        background: 'oklch(0.9816 0 0)',
        foreground: 'oklch(0.1221 0 0)',
        card: 'oklch(0.9911 0 0)',
        'card-foreground': 'oklch(0.1221 0 0)',
        popover: 'oklch(0.9911 0 0)',
        'popover-foreground': 'oklch(0.1221 0 0)',
        primary: 'oklch(0.6498 0.1546 29.2339)',
        'primary-foreground': 'oklch(0.9911 0 0)',
        secondary: 'oklch(0.2477 0.0368 265.1577)',
        'secondary-foreground': 'oklch(0.9911 0 0)',
        muted: 'oklch(0.9700 0 0)',
        'muted-foreground': 'oklch(0.5560 0 0)',
        accent: 'oklch(0.6498 0.1546 29.2339)',
        'accent-foreground': 'oklch(0.9911 0 0)',
        destructive: 'oklch(0.6498 0.1546 29.2339)',
        'destructive-foreground': 'oklch(0.9911 0 0)',
        border: 'oklch(0.9200 0 0)',
        input: 'oklch(0.9200 0 0)',
        ring: 'oklch(0.6498 0.1546 29.2339)',
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