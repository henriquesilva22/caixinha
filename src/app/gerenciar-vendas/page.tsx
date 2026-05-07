import Link from 'next/link';

export default function GerenciarVendas() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Módulo de Vendas Removido</h1>
      <p className="text-muted-foreground">
        O sistema foi reconfigurado para focar apenas no controle de estoque. Todas as funcionalidades
        relacionadas a vendas, e-commerce, cadastro de clientes e PDV foram removidas com segurança.
      </p>
      <div className="mt-4">
        <Link href="/estoque" className="inline-block px-4 py-2 bg-primary text-white rounded-lg">
          Ir para Estoque
        </Link>
      </div>
    </div>
  );
}
