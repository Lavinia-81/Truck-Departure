import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Truck Departure Dashboard',
  description: 'Real-time departure board for logistics.',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)}>
      <body className={"font-body antialiased"}>
          <div className="flex min-h-screen w-full flex-col">
            <main className="flex flex-1 flex-col">
              {children}
            </main>
          </div>
          <Toaster />
      </body>
    </html>
  );
}
