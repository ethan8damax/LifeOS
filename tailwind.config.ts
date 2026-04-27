import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        background: {
          DEFAULT: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
        },
        // Text — use 'text-foreground', 'text-foreground-secondary', etc.
        foreground: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        // Borders — use 'border-line' (interactive) or 'border-line-subtle' (cards)
        line: {
          DEFAULT: 'var(--color-border-secondary)',
          subtle: 'var(--color-border-tertiary)',
        },
        // Semantic intent colors
        goals: {
          DEFAULT:    'var(--color-goals)',
          subtle:     'var(--color-goals-subtle)',
          'on-subtle':'var(--color-goals-on-subtle)',
        },
        habits: {
          DEFAULT:    'var(--color-habits)',
          subtle:     'var(--color-habits-subtle)',
          'on-subtle':'var(--color-habits-on-subtle)',
        },
        finance: {
          DEFAULT:    'var(--color-finance)',
          subtle:     'var(--color-finance-subtle)',
          'on-subtle':'var(--color-finance-on-subtle)',
        },
        tasks: {
          DEFAULT:    'var(--color-tasks)',
          subtle:     'var(--color-tasks-subtle)',
          'on-subtle':'var(--color-tasks-on-subtle)',
        },
      },
    },
  },
  plugins: [],
}
export default config
