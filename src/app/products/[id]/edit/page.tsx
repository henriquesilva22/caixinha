'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import dynamic from 'next/dynamic';

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: product, error } = useSWR(`/api/products/${params.id}`, fetcher);

  const [quantity, setQuantity] = useState(product?.currentQuantity || 0);
  const [isPerishable, setIsPerishable] = useState(product?.isPerishable || false);
  const [expiryDate, setExpiryDate] = useState(product?.expiryDate || '');
  const Scanner = dynamic(() => import('@/components/Scanner/QRCodeScanner'), { ssr: false });
  const [showScanner, setShowScanner] = useState(false);

  if (error) return <div>Falha ao carregar produto</div>;
  if (!product) return <div>Carregando...</div>;

  const handleSave = async () => {
    await fetch(`/api/products`, {
      method: 'PUT',
      body: JSON.stringify({ id: params.id, quantity }),
      headers: { 'Content-Type': 'application/json' },
    });
    mutate(`/api/products/${params.id}`);
    router.push('/products');
  };

  return (
    <div>
      <h1>Editar Produto</h1>
      <div>
        <label>
          Nome:
          <input type="text" value={product.name} readOnly />
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isPerishable} onChange={(e) => setIsPerishable(e.target.checked)} /> Produto perecível
        </label>
      </div>
      {isPerishable && (
        <div>
          <label>
            Data de validade padrão:
            <input type="date" value={expiryDate || ''} onChange={(e) => setExpiryDate(e.target.value)} />
          </label>
        </div>
      )}
      <div>
        <button onClick={() => setShowScanner(true)}>Abrir leitor QR/Barcode</button>
        {showScanner && (
          <Scanner onDetected={(value: string) => { console.log('Lido:', value); setShowScanner(false); }} onClose={() => setShowScanner(false)} />
        )}
      </div>
      <div>
        <label>
          Quantidade:
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
      </div>
      <button onClick={handleSave}>Salvar</button>
      <button onClick={() => router.push('/products')}>Cancelar</button>
    </div>
  );
}