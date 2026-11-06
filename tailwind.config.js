/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic theme-driven colors
        'primary': withOpacity('--color-primary-rgb'),
        'primary-foreground': withOpacity('--color-primary-foreground-rgb'),
        
        'secondary': withOpacity('--color-secondary-rgb'),
        'secondary-foreground': withOpacity('--color-secondary-foreground-rgb'),
        
        'accent': withOpacity('--color-accent-rgb'),
        'accent-foreground': withOpacity('--color-accent-foreground-rgb'),
        
        'background': withOpacity('--color-background-rgb'),
        'surface': withOpacity('--color-surface-rgb'),
        
        'text-primary': withOpacity('--color-text-primary-rgb'),
        'text-secondary': withOpacity('--color-text-secondary-rgb'),
        
        'success': withOpacity('--color-success-rgb'),
        'success-foreground': withOpacity('--color-success-foreground-rgb'),
        
        'warning': withOpacity('--color-warning-rgb'),
        'warning-foreground': withOpacity('--color-warning-foreground-rgb'),
        
        'error': withOpacity('--color-error-rgb'),
        'error-foreground': withOpacity('--color-error-foreground-rgb'),
        
        'border': withOpacity('--color-border-rgb'),
        'border-accent': withOpacity('--color-border-accent-rgb'),
      },
      fontFamily: {
        'heading': ['JetBrains Mono', 'monospace'],
        'body': ['Inter', 'sans-serif'],
        'caption': ['Roboto Mono', 'monospace'],
        'code': ['Fira Code', 'monospace'],
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      },
      boxShadow: {
        'glow-primary': 'var(--shadow-primary)',
        'glow-secondary': 'var(--shadow-secondary)',
        'glow-accent': 'var(--shadow-accent)',
        'glow-primary-lg': 'var(--shadow-primary)',
        'glow-secondary-lg': 'var(--shadow-secondary)',
        'glow-accent-lg': 'var(--shadow-accent)',
        'neon': 'var(--shadow-primary)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'terminal-scan': 'terminal-scan 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          'from': {
            'box-shadow': '0 0 4px var(--color-primary)',
          },
          'to': {
            'box-shadow': '0 0 16px var(--color-primary)',
          },
        },
        'terminal-scan': {
          '0%': {
            'left': '-100%',
          },
          '100%': {
            'left': '100%',
          },
        },
        'fade-in': {
          'from': {
            'opacity': '0',
          },
          'to': {
            'opacity': '1',
          },
        },
        'bounce-gentle': {
          '0%, 100%': {
            'transform': 'translateY(0)',
          },
          '50%': {
            'transform': 'translateY(-10px)',
          },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
    require('tailwindcss-elevation'),
    require('tailwindcss-fluid-type'),
  ],
};
