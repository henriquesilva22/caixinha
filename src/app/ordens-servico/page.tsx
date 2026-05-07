import Link from 'next/link';

export default function OrdensServico() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Ordens de Serviço (dependência de Clientes removida)</h1>
      <p className="text-muted-foreground">
        Algumas funcionalidades de Ordens de Serviço dependiam do cadastro de clientes, que foi removido
        para focar o sistema em controle de estoque. Se preferir, posso adaptar esta página para funcionar
        sem cadastro de clientes (por exemplo: entrada livre de nome/contato) ou removê-la totalmente.
      </p>
      <div className="mt-4">
        <Link href="/estoque" className="inline-block px-4 py-2 bg-primary text-white rounded-lg">
          Ir para Estoque
        </Link>
      </div>
    </div>
  );
}
