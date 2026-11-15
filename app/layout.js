import "@fontsource-variable/atkinson-hyperlegible-next/index.css";
import "@fontsource-variable/atkinson-hyperlegible-mono/index.css";
import "./globals.css";

export const metadata = {
  title: "RxGuard – Smart Medication Ordering System (educational simulation)",
  description:
    "An educational simulation of a hospital CPOE workflow for a Pharm-D presentation. Fictional data only. Not a real prescribing or clinical decision-support system.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2147",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
