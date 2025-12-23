/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f3f9',
                    100: '#ebe7f3',
                    200: '#d7cfe7',
                    300: '#c3b7db',
                    400: '#af9fcf',
                    500: '#A195BB', // Main purple
                    600: '#8177a6',
                    700: '#615991',
                    800: '#413b7c',
                    900: '#211d67',
                },
                secondary: {
                    50: '#e6f9f9',
                    100: '#ccf3f2',
                    200: '#99e7e5',
                    300: '#66dbd8',
                    400: '#33cfcb',
                    500: '#21B4B1', // Main teal
                    600: '#1a908e',
                    700: '#146c6b',
                    800: '#0d4848',
                    900: '#072425',
                },
            },
        },
    },
    plugins: [],
}
