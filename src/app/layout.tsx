import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/shared/AppNav";

export const metadata: Metadata = {
  title: "FoodFlow OS",
  description: "Sistema Operacional Premium para Food Service",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="h-screen overflow-hidden bg-neutral-900 text-neutral-50 flex flex-col">
        <AppNav />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
