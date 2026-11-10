import defaultTheme from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        page: "#FAFBFC",
        // Azul mais escuro para botões/links com texto (contraste AA sobre branco)
        primary: { DEFAULT: "#2F7DBF", hover: "#286CA6" },
        ink: { DEFAULT: "#1F2937", muted: "#6B7280" },
        line: "#E5E7EB",
        chart: { primary: "#6CB2EB", compare: "#FED7AA" },
        positive: { DEFAULT: "#38C172", soft: "#E3F6EA" },
        negative: { DEFAULT: "#EF5753", soft: "#FDE8E7" },
        accent: "#FAAD63",
      },
      borderRadius: {
        card: "6px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [animate],
};
