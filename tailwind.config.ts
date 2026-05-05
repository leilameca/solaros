import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-s': 'var(--border-s)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        accent: 'var(--accent)',
        'accent-bg': 'var(--accent-bg)',
        'accent-bd': 'var(--accent-bd)',
        'solar-green': 'var(--green)',
        'green-bg': 'var(--green-bg)',
        'solar-blue': 'var(--blue)',
        'blue-bg': 'var(--blue-bg)',
        'solar-red': 'var(--red)',
        'red-bg': 'var(--red-bg)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      maxWidth: {
        content: '1100px',
      },
    },
  },
  plugins: [],
}

export default config
