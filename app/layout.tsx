import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/src/components/theme-provider';

export const metadata: Metadata = {
  title: 'EntregueJá - Hub de Logística & Acerto de Motoboys',
  description:
    'Plataforma SaaS Multi-Tenant para automação logística de entregas, roteamento viário OSRM e fechamento financeiro de taxas para motoboys em hamburguerias, pizzarias e farmácias.',
  openGraph: {
    title: 'EntregueJá - Hub de Logística & Acerto de Motoboys',
    description:
      'Automatize o acerto semanal de motoboys com cálculo de rota real por KM e portal com código PIN para entregadores.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
