import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        brand: {
          50: '#f6f2ff',
          100: '#efe8ff',
          200: '#ddceff',
          300: '#c2a8ff',
          400: '#9c74ff',
          500: '#7b4dff',
          600: '#6838f3',
          700: '#5829d7',
          800: '#4723ae',
          900: '#3b218d',
        },
        lilac: '#caa9ff',
        ice: '#f7f8ff',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      fontFamily: {
        sans: ['Inter', '"SF Pro Display"', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Inter', '"SF Pro Display"', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 26px 64px rgba(123, 77, 255, 0.18)',
        panel: '0 32px 90px rgba(127, 109, 182, 0.13)',
        soft: '0 18px 42px rgba(149, 130, 196, 0.12)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.72)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7b4dff 0%, #5c87ff 100%)',
        'lilac-gradient': 'linear-gradient(135deg, #7b4dff 0%, #ba8fff 100%)',
        'panel-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,245,255,0.9) 100%)',
        'soft-radial': 'radial-gradient(circle at center, rgba(123, 77, 255, 0.18), transparent 70%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'pulse-glow 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
