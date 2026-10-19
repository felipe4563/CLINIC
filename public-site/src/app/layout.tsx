import type { Metadata, Viewport } from "next";
import { Cormorant, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Clinic NovagED — Medicina estética en Cochabamba",
  description:
    "Medicina estética, ginecología, ecografía, fisioterapia y enfermería con la Dra. Maria Noemi Ponce Caisiri. Reserva en línea y paga con QR. Calle Lanza N.º 670, Cochabamba.",
};

export const viewport: Viewport = {
  themeColor: "#F3EEEC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${cormorant.variable} ${jost.variable} font-sans bg-cream text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
