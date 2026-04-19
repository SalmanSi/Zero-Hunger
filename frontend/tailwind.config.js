/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0d631b',
                'primary-container': '#2e7d32',
                'on-primary-container': '#cbffc2',
                'primary-fixed': '#a3f69c',
                'on-primary-fixed-variant': '#005312',

                secondary: '#9c4400',
                'secondary-container': '#fd7613',
                'on-secondary-container': '#5b2500',

                error: '#ba1a1a',
                'error-container': '#ffdad6',

                surface: '#f3faff',
                'surface-container-lowest': '#ffffff',
                'surface-container-low': '#e6f6ff',
                'surface-container': '#dbf1fe',
                'surface-container-highest': '#cfe6f2',
                'surface-variant': '#cfe6f2',

                'on-surface': '#071e27',
                'on-surface-variant': '#444746', // Added missing color from CSS
                'outline-variant': '#bfcaba',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Manrope', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
