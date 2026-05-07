'use client';

import { useState } from 'react';
import QRCodeScanner from '@/components/Scanner/QRCodeScanner';

export default function ScannerPage() {
  const [result, setResult] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [productInfo, setProductInfo] = useState<any>(null);

  const handleDetected = async (value: string) => {
    setResult(value);
    setShowScanner(false);
    try {
      // Try to find product by barcode
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        // API returns array
        if (Array.isArray(data) && data.length > 0) {
          setProductInfo(data[0]);
        } else {
          setProductInfo(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Leitor de QR / Código de Barras</h1>
      {showScanner ? (
        <QRCodeScanner onDetected={handleDetected} onClose={() => setShowScanner(false)} />
      ) : (
        <div>
          <div className="mb-2">Valor lido: <strong>{result}</strong></div>
          {productInfo ? (
            <div className="p-4 border rounded">
              <div className="font-semibold">Produto encontrado</div>
              <div>Nome: {productInfo.name}</div>
              <div>Código interno: {productInfo.internalCode}</div>
              <div>Quantidade atual: {productInfo.currentQuantity}</div>
            </div>
          ) : (
            <div className="p-4 border rounded">Produto não encontrado. Deseja cadastrar?</div>
          )}
          <div className="mt-4">
            <button className="btn" onClick={() => setShowScanner(true)}>Ler novamente</button>
          </div>
        </div>
      )}
    </div>
  );
}
