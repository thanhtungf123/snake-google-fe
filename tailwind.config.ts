import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu lấy cảm hứng Google Snake (tự định nghĩa, không copy asset gốc)
        board: {
          light: '#aad751',
          dark: '#a2d149',
        },
        apple: '#e7471d',
        snake: '#4673e8',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
