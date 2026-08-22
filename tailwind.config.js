/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky1: '#1c6fe0',
        sky2: '#bfe9ff',
        aero: '#00d1b2',
        aerodeep: '#008f7a',
        grass1: '#8fce5a',
        grass2: '#3f7a24',
        navy: '#082c66',
        navylight: '#4a9bea',
        ink: '#0b1830',
        coral: '#ff5d8f',
        magenta: '#c14fe0',
        gold: '#ffc93c',
        glass: 'rgba(255,255,255,0.55)',
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        window: '0 2px 0 rgba(255,255,255,0.6) inset, 0 20px 40px -12px rgba(10,30,60,0.35), 0 2px 6px rgba(10,30,60,0.15)',
        taskbar: '0 -8px 32px rgba(8,20,50,0.3)',
        chrome: '0 1px 0 rgba(255,255,255,0.9) inset, 0 -6px 12px rgba(0,0,0,0.12) inset, 0 10px 24px rgba(10,40,90,0.3)',
        orb: '0 2px 4px rgba(255,255,255,0.8) inset, 0 -6px 10px rgba(0,0,0,0.15) inset, 0 8px 16px rgba(10,40,90,0.25)',
      },
      borderRadius: {
        win: '14px',
      },
    },
  },
  plugins: [],
}
