import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'Ma boîte à prière · Portons nos fardeaux les uns les autres',
  description:
    'Espace chrétien d’intercession fraternelle. Déposez vos sujets de prière en toute confiance et priez pour la communauté.',
  openGraph: {
    title: 'Ma boîte à prière',
    description: 'Portons nos fardeaux les uns les autres dans la prière.',
    siteName: 'Ma boîte à prière',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="flex flex-col min-h-screen bg-fond text-encre">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
