/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        baby: { pink:"#ff7bc8", purple:"#9b80ff", blue:"#5eaaff", soft:"#f8f9ff" },
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(90deg, #5eaaff 0%, #9b80ff 50%, #ff7bc8 100%)",
      },
      boxShadow: { soft: "0 10px 30px -12px rgba(0,0,0,0.1)" },
      fontFamily: { sans: ['"Poppins"','ui-sans-serif','system-ui'] },
    },
  },
  plugins: [],
};
