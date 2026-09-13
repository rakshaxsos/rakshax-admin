import './globals.css';

export const metadata = { title: 'RakshaX Command Center', description: 'RakshaX emergency response administration' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
