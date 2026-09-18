import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool, Upload } from 'lucide-react';

interface Props {
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
  title: string;
}

export default function SignaturePad({ initialDataUrl, onSave, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialDataUrl);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(initialDataUrl);

  useEffect(() => {
    if (initialDataUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = initialDataUrl;
      }
    }
  }, [initialDataUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCurrentUrl(dataUrl);
      onSave(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setCurrentUrl(undefined);
      onSave('');
    }
  };

  const handleUploadImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCurrentUrl(dataUrl);
      setHasSignature(true);
      onSave(dataUrl);
      
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = dataUrl;
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool size={12} className="text-emerald-600" />
          {title}
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[9px] font-bold text-gray-500 hover:text-emerald-700 cursor-pointer flex items-center gap-1">
            <Upload size={11} /> Cargar imagen
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleUploadImage(f);
              }}
            />
          </label>
          {hasSignature && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[9px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"
            >
              <Eraser size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="relative border border-dashed border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={300}
          height={90}
          className="w-full h-24 bg-transparent cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-gray-400 font-medium select-none">
            Dibuje su firma con el cursor o pantalla táctil
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 text-center pt-1">
        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">Línea de firma digital</span>
      </div>
    </div>
  );
}
