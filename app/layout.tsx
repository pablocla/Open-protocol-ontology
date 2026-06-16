/**
 * Open Protocol ONTOLOGY (OPO) - Root Layout
 * Licensed under the Apache License, version 2.0
 */

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ClientLayout from '../components/ClientLayout';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Open Protocol Ontology (OPO) | v0.1.0',
  description: 'An open standard semantic layer for AI agents to discover, understand, and interoperate with ERP systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="opo-version" content="0.1.0" />
        <meta name="ai-agent-discovery" content="canonical" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-[#0a0a0a] text-slate-300 font-sans antialiased overflow-hidden" suppressHydrationWarning>
        <Toaster 
          position="top-right" 
          theme="dark" 
          richColors 
          toastOptions={{
            style: { 
              background: '#171717', 
              border: '1px solid #262626', 
              color: '#e5e5e5' 
            }
          }} 
        />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
