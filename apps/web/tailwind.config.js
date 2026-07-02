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
        background: '#1A0A0A',
        foreground: '#FFFFFF',
        card: '#2A2A2A',
        'card-foreground': '#FFFFFF',
        popover: '#2A2A2A',
        'popover-foreground': '#FFFFFF',
        primary: '#E8420A',
        'primary-foreground': '#FFFFFF',
        secondary: '#2A1A1A',
        'secondary-foreground': '#FFFFFF',
        muted: '#2A1A1A',
        'muted-foreground': '#9A8A7A',
        accent: '#E8420A',
        'accent-foreground': '#FFFFFF',
        destructive: '#CC1C1C',
        'destructive-foreground': '#FFFFFF',
        border: 'rgba(255, 255, 255, 0.2)',
        input: '#1E1E1E',
        ring: '#E8420A',
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