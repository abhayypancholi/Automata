import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Automata Playground',
  description: 'Automata Theory Playground and Mini Model-Description Parser',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
