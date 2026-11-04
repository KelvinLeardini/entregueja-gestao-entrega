import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-extrabold text-amber-500 mb-2">404</h1>
      <h2 className="text-lg font-bold text-white mb-4">Página ou Comércio Não Encontrado</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        O endereço acessado não existe ou foi digitado incorretamente.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
      >
        Voltar à Página Inicial
      </Link>
    </div>
  );
}
