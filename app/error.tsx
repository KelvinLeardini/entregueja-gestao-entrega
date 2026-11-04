'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-xl font-bold text-white mb-4">Ocorreu um erro inesperado</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
      >
        Tentar novamente
      </button>
    </div>
  );
}
