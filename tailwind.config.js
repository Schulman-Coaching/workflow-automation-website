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
        primary: {
          DEFAULT: '#4a1d96',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#fbbf24',
          foreground: '#000000',
        }
      },
    },
  },
  plugins: [],
}
