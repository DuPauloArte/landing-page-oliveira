import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solicite seu orçamento | Oliveira Estruturas",
  description: "Informe as necessidades da sua operação e receba uma avaliação personalizada para estruturas de armazenagem.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
