import './globals.css';
import { Timeline } from '../presentation/components/timeline/Timeline';
import { Topbar } from '../presentation/components/navigation/Topbar';

export const metadata = {
  title: 'Skyflora | Monitoramento',
  description: 'A ciência do clima e o impacto político num só ecossistema.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="text-slate-300 min-h-screen font-sans selection:bg-cyan-500/30">
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 flex relative pb-32">
            <div className="flex-1 flex flex-col items-center w-full">
              {children}
            </div>
          </main>
          <Timeline />
        </div>
      </body>
    </html>
  );
}
