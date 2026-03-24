import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/shared/LayoutShell";
import ToastContainer from "@/components/shared/ToastContainer";

export const metadata: Metadata = {
  title: "FoodFlow OS",
  description: "Sistema Operacional Premium para Food Service",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="h-screen overflow-hidden bg-neutral-900 text-neutral-50 flex flex-col">
        <LayoutShell>{children}</LayoutShell>
        <ToastContainer />
      </body>
    </html>
  );
}
