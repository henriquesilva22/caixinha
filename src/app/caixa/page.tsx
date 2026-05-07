import Link from 'next/link';

export default function Caixa() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">PDV / Caixa Removido</h1>
      <p className="text-muted-foreground">
        O módulo de PDV (caixa) foi removido. O sistema agora foca apenas no controle de estoque.
      </p>
      <div className="mt-4">
        <Link href="/estoque" className="inline-block px-4 py-2 bg-primary text-white rounded-lg">
          Ir para Estoque
        </Link>
      </div>
    </div>
  );
}
