import type { Metadata } from "next";
import "./globals.css";
import { GDSSProvider } from "@/context/GDSSContext";

export const metadata: Metadata = {
  title: "GDSS Ormawa - Sistem Pendukung Keputusan Kelompok (Metode Borda)",
  description:
    "Sistem Pendukung Keputusan Kelompok Penentuan Prioritas Program Kerja Organisasi Mahasiswa Menggunakan Metode Borda",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <GDSSProvider>{children}</GDSSProvider>
      </body>
    </html>
  );
}
