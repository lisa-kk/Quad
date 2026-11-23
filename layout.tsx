import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Quad — Buy & sell with your campus',
  description:
    'Quad is a students-only campus marketplace. One network per college, .edu email only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
