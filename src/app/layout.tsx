import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodFlow OS",
  description: "Sistema Operacional Premium para Food Service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="h-screen overflow-hidden bg-neutral-900 text-neutral-50">
        {children}
      </body>
    </html>
  );
}
