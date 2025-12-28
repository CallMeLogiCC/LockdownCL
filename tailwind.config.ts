import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "lockdown-blue": "#0b1020",
        "lockdown-cyan": "#1ee3cf"
      }
    }
  },
  plugins: []
};

export default config;
