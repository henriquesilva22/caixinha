'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface Props {
  onDetected: (value: string) => void;
  onClose?: () => void;
}

export default function QRCodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reader] = useState(() => new BrowserMultiFormatReader());
  const [scanning, setScanning] = useState(false);
  const [cameraChoice, setCameraChoice] = useState<'user' | 'environment' | null>(null);

  useEffect(() => {
    return () => {
      try {
        (reader as any).reset?.();
      } catch (e) {}
    };
  }, [reader]);

  const startWithFacing = async (facing: 'user' | 'environment') => {
    setCameraChoice(facing);
    setScanning(true);
    try {
      // Try to get a deviceId matching facing via getUserMedia first to populate labels
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: facing } } });
      // Once permission is granted, enumerate and select device
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      let chosen = devices.find(d => /back|rear|environment|traseira|traseiro/i.test(d.label)) || devices[0];
      if (!chosen && devices.length > 0) chosen = devices[0];

      const deviceId = chosen?.deviceId || undefined;
      if (!videoRef.current) return;
      reader.decodeFromVideoDevice(deviceId, videoRef.current, (result: any, err: any) => {
        if (result) {
          onDetected(result.getText());
          stop();
        }
      });
    } catch (err) {
      // Fallback: try without exact facing (some browsers don't support exact)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        let chosen = devices.find(d => /back|rear|environment|traseira|traseiro/i.test(d.label)) || devices[0];
        const deviceId = chosen?.deviceId || undefined;
        if (!videoRef.current) return;
        reader.decodeFromVideoDevice(deviceId, videoRef.current, (result: any) => {
          if (result) {
            onDetected(result.getText());
            stop();
          }
        });
      } catch (e) {
        console.error('Erro ao acessar câmera:', e);
        setScanning(false);
      }
    }
  };

  const stop = () => {
    try {
      (reader as any).reset?.();
    } catch (e) {}
    setScanning(false);
    if (onClose) onClose();
  };

  return (
    <div className="scanner-root">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => startWithFacing('environment')} className="btn">Usar câmera traseira</button>
        <button onClick={() => startWithFacing('user')} className="btn">Usar câmera frontal</button>
        <button onClick={stop} className="btn-ghost">Fechar</button>
      </div>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <video ref={videoRef} style={{ width: '100%', borderRadius: 8 }} />
      </div>
    </div>
  );
}
