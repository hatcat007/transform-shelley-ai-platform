import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
export const metadata: Metadata = { title: 'Shelley — Your ambition, amplified.', description: 'A thoughtful workspace for your next big thing. Business agents, better prompts, and your favorite AI models, together in Shelley.' };
export default function RootLayout({ children }: { children: ReactNode }) {
 return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
