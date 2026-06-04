/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  safelist: [
    {
      pattern:
        /(bg|text|border|shadow)-(yellow|emerald|orange|sky|red|purple)-(100|200|300|400|500|600|700)/,
    },
  ],
};
