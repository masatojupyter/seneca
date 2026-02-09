import type { Metadata } from "next";
import {NextIntlClientProvider} from 'next-intl';
import "./globals.css";

export const metadata: Metadata = {
  title: "Token Wage - XRP Payroll Management",
  description: "Manage employee time tracking and cryptocurrency payroll with XRP",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
