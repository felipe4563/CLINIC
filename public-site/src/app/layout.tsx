import type { Metadata } from "next";
import { Bodoni_Moda } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Clinic NovagED — Salud, Belleza, Armonía",
  description: "Arquitectura facial y medicina estética avanzada en Cochabamba, Bolivia.",
  icons: {
    icon: "/novaged-assets/icon-Bvf3Rv87.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${bodoni.variable} font-sans bg-cream text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
