/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#121212',
                surface: '#1e1e1e',
                'surface-hover': '#2a2a2a',
                primary: '#F25C05', // Skina Beer Orange
                'primary-hover': '#d94e00',
                accent: '#ff0000',
                success: '#4ecdc4',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [
        require('tailwindcss-animate'),
    ],
}
