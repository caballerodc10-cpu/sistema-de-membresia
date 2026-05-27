import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: "Oruga Cowork",
  description: "Sistema de gestión de salas y reservas para Oruga Cowork",
  applicationName: "Oruga Cowork",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oruga Cowork",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/logo/logo-oruga-sin-fondo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${dmSans.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
