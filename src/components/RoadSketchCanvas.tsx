import React, { useRef, useState, useEffect } from 'react';
import {
  Car,
  Truck,
  Bike,
  AlertOctagon,
  ArrowUpRight,
  PenTool,
  Type,
  RotateCcw,
  Trash2,
  Upload,
  Compass,
  Minus
} from 'lucide-react';

interface Props {
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
}

type RoadTemplate = 'recta_doble' | 'interseccion_cruz' | 'interseccion_t' | 'curva' | 'glorieta' | 'cuadricula';
type SketchTool = 'lapiz' | 'frenado' | 'trayectoria' | 'vehiculo_1' | 'vehiculo_2' | 'camion' | 'moto' | 'impacto' | 'pare' | 'texto';

export default function RoadSketchCanvas({ initialDataUrl, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [template, setTemplate] = useState<RoadTemplate>('interseccion_cruz');
  const [tool, setTool] = useState<SketchTool>('vehiculo_1');
  const [angleDeg, setAngleDeg] = useState<number>(0);
  const [customText, setCustomText] = useState<string>('Vía Principal');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // Draw base template grid & road geometry
  const drawTemplateOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, tpl: RoadTemplate) => {
    ctx.save();
    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Technical millimeter / meter grid (20px = 2m scale)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.7;
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cx = width / 2;
    const cy = height / 2;
    const roadW = 110;

    ctx.fillStyle = '#cbd5e1'; // Asphalt
    ctx.strokeStyle = '#475569'; // Curbs
    ctx.lineWidth = 2;

    if (tpl === 'recta_doble') {
      ctx.fillRect(0, cy - roadW / 2, width, roadW);
      ctx.beginPath();
      ctx.moveTo(0, cy - roadW / 2);
      ctx.lineTo(width, cy - roadW / 2);
      ctx.moveTo(0, cy + roadW / 2);
      ctx.lineTo(width, cy + roadW / 2);
      ctx.stroke();

      // Double yellow center line
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy - 3);
      ctx.lineTo(width, cy - 3);
      ctx.moveTo(0, cy + 3);
      ctx.lineTo(width, cy + 3);
      ctx.stroke();

      // Dashed lane dividers
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(0, cy - roadW / 4);
      ctx.lineTo(width, cy - roadW / 4);
      ctx.moveTo(0, cy + roadW / 4);
      ctx.lineTo(width, cy + roadW / 4);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (tpl === 'interseccion_cruz') {
      ctx.fillRect(0, cy - roadW / 2, width, roadW);
      ctx.fillRect(cx - roadW / 2, 0, roadW, height);

      // Center lines
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(cx - roadW / 2, cy);
      ctx.moveTo(cx + roadW / 2, cy);
      ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, cy - roadW / 2);
      ctx.moveTo(cx, cy + roadW / 2);
      ctx.lineTo(cx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosswalks
      ctx.fillStyle = '#ffffff';
      for (let i = -roadW / 2 + 10; i < roadW / 2 - 10; i += 14) {
        ctx.fillRect(cx - roadW / 2 - 18, cy + i, 12, 6);
        ctx.fillRect(cx + roadW / 2 + 6, cy + i, 12, 6);
        ctx.fillRect(cx + i, cy - roadW / 2 - 18, 6, 12);
        ctx.fillRect(cx + i, cy + roadW / 2 + 6, 6, 12);
      }
    } else if (tpl === 'interseccion_t') {
      ctx.fillRect(0, cy - roadW / 2, width, roadW);
      ctx.fillRect(cx - roadW / 2, cy, roadW, height - cy);

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.moveTo(cx, cy + roadW / 2);
      ctx.lineTo(cx, height);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (tpl === 'curva') {
      ctx.lineWidth = roadW;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.arc(width * 0.25, height * 0.85, 220, -Math.PI / 2, 0);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#eab308';
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(width * 0.25, height * 0.85, 220, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (tpl === 'glorieta') {
      ctx.fillRect(0, cy - 42, width, 84);
      ctx.fillRect(cx - 42, 0, 84, height);

      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.fillStyle = '#bbf7d0';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }

    // North Compass Rose (top-right corner)
    const nx = width - 36;
    const ny = 36;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(nx, ny, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(nx, ny - 14);
    ctx.lineTo(nx - 5, ny + 4);
    ctx.lineTo(nx + 5, ny + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', nx, ny - 15);

    // Scale Legend (bottom-left)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(10, height - 26, 135, 18);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ESCALA: 1 cuad = 2.0m', 16, height - 14);

    ctx.restore();
  };

  const saveCanvasToState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setHistory(prev => [...prev.slice(-14), dataUrl]);
    onSave(dataUrl);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHistory([initialDataUrl]);
      };
      img.src = initialDataUrl;
    } else {
      drawTemplateOnCanvas(ctx, canvas.width, canvas.height, template);
      const initial = canvas.toDataURL('image/png');
      setHistory([initial]);
      onSave(initial);
    }
  }, []);

  const handleApplyTemplate = (newTpl: RoadTemplate) => {
    setTemplate(newTpl);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawTemplateOnCanvas(ctx, canvas.width, canvas.height, newTpl);
    saveCanvasToState();
  };

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    const rad = (angleDeg * Math.PI) / 180;

    if (tool === 'vehiculo_1' || tool === 'vehiculo_2') {
      ctx.rotate(rad);
      const isV1 = tool === 'vehiculo_1';
      ctx.fillStyle = isV1 ? '#2563eb' : '#e11d48';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      // Car body
      ctx.beginPath();
      ctx.roundRect(-22, -12, 44, 24, 5);
      ctx.fill();
      ctx.stroke();
      // Windshield (front is to the right +X)
      ctx.fillStyle = '#bfdbfe';
      ctx.fillRect(6, -9, 9, 18);
      // Headlights
      ctx.fillStyle = '#fde047';
      ctx.fillRect(19, -10, 3, 5);
      ctx.fillRect(19, 5, 3, 5);
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isV1 ? 'V1' : 'V2', -6, 0);
    } else if (tool === 'camion') {
      ctx.rotate(rad);
      ctx.fillStyle = '#0f766e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-34, -14, 68, 28, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#99f6e4';
      ctx.fillRect(18, -11, 10, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CAMIÓN', -6, 0);
    } else if (tool === 'moto') {
      ctx.rotate(rad);
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-14, -6, 28, 12, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MOTO', 0, 0);
    } else if (tool === 'impacto') {
      // Red/Yellow collision starburst
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spikes = 10;
      const outerR = 18;
      const innerR = 8;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / spikes;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('IMP', 0, 0);
    } else if (tool === 'pare') {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PARE', 0, 0);
    } else if (tool === 'texto') {
      const label = customText.trim() || 'Ref.';
      ctx.font = 'bold 11px sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - 6, -10, textWidth + 12, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
    }

    ctx.restore();
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCoords(e);

    if (['vehiculo_1', 'vehiculo_2', 'camion', 'moto', 'impacto', 'pare', 'texto'].includes(tool)) {
      drawStamp(ctx, pt.x, pt.y);
      saveCanvasToState();
      return;
    }

    setIsDrawing(true);
    setStartPoint(pt);

    if (tool === 'lapiz') {
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCoords(e);

    if (tool === 'lapiz') {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ((tool === 'frenado' || tool === 'trayectoria') && startPoint) {
      const endPt = 'changedTouches' in e
        ? (() => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
              x: (e.changedTouches[0].clientX - rect.left) * scaleX,
              y: (e.changedTouches[0].clientY - rect.top) * scaleY,
            };
          })()
        : getCoords(e);

      ctx.save();
      if (tool === 'frenado') {
        // Skid marks: double dashed black tire tracks
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
      } else if (tool === 'trayectoria') {
        // Directional trajectory arrow
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();

        const angle = Math.atan2(endPt.y - startPoint.y, endPt.x - startPoint.x);
        const headLen = 11;
        ctx.beginPath();
        ctx.moveTo(endPt.x, endPt.y);
        ctx.lineTo(endPt.x - headLen * Math.cos(angle - Math.PI / 6), endPt.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endPt.x - headLen * Math.cos(angle + Math.PI / 6), endPt.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    setIsDrawing(false);
    setStartPoint(null);
    saveCanvasToState();
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHist = history.slice(0, -1);
    const prevUrl = newHist[newHist.length - 1];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHistory(newHist);
      onSave(prevUrl);
    };
    img.src = prevUrl;
  };

  const handleUploadImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveCanvasToState();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-4 space-y-4">
      {/* Top Toolbar: Plantillas de Vía */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">
            Plantilla Vial:
          </span>
          {[
            { id: 'interseccion_cruz', label: 'Intersección (+)' },
            { id: 'interseccion_t', label: 'Intersección (T)' },
            { id: 'recta_doble', label: 'Recta Doble Vía' },
            { id: 'curva', label: 'Curva' },
            { id: 'glorieta', label: 'Glorieta' },
            { id: 'cuadricula', label: 'Solo Cuadrícula' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleApplyTemplate(t.id as RoadTemplate)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                template === t.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0">
            <Upload size={13} />
            Subir Imagen Croquis
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
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw size={13} />
            Deshacer
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate(template)}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 size={13} />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Stamp & Drawing Tools */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">
          Elementos del Croquis:
        </span>

        {[
          { id: 'vehiculo_1', label: 'Vehículo 1 (V1)', icon: Car, color: 'text-blue-600' },
          { id: 'vehiculo_2', label: 'Vehículo 2 (V2)', icon: Car, color: 'text-rose-600' },
          { id: 'camion', label: 'Camión / Bus', icon: Truck, color: 'text-teal-700' },
          { id: 'moto', label: 'Moto / Bici', icon: Bike, color: 'text-amber-600' },
          { id: 'impacto', label: 'Punto Impacto', icon: AlertOctagon, color: 'text-red-600' },
          { id: 'trayectoria', label: 'Flecha Trayectoria (Arrastrar)', icon: ArrowUpRight, color: 'text-red-600' },
          { id: 'frenado', label: 'Huella Frenado (Arrastrar)', icon: Minus, color: 'text-slate-800' },
          { id: 'pare', label: 'Señal PARE', icon: Compass, color: 'text-red-600' },
          { id: 'texto', label: 'Etiqueta / Cota', icon: Type, color: 'text-slate-700' },
          { id: 'lapiz', label: 'Trazo Libre', icon: PenTool, color: 'text-emerald-600' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTool(item.id as SketchTool)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all whitespace-nowrap shrink-0 ${
                tool === item.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} className={tool === item.id ? 'text-white' : item.color} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Contextual Sub-controls for rotation or text */}
      {['vehiculo_1', 'vehiculo_2', 'camion', 'moto'].includes(tool) && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70 text-xs">
          <span className="font-bold text-slate-600">Orientación del vehículo al hacer clic en el mapa:</span>
          {[
            { deg: 0, label: '→ Este (0°)' },
            { deg: 90, label: '↓ Sur (90°)' },
            { deg: 180, label: '← Oeste (180°)' },
            { deg: 270, label: '↑ Norte (270°)' },
            { deg: 45, label: '↘ (45°)' },
            { deg: 135, label: '↙ (135°)' },
            { deg: 225, label: '↖ (225°)' },
            { deg: 315, label: '↗ (315°)' },
          ].map(o => (
            <button
              key={o.deg}
              type="button"
              onClick={() => setAngleDeg(o.deg)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 ${
                angleDeg === o.deg ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {tool === 'texto' && (
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70 text-xs">
          <span className="font-bold text-slate-600">Texto o cota a insertar al hacer clic:</span>
          <input
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="Ej. Calle 80, Frenado 14m, Postes..."
            className="px-3 py-1 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 w-64"
          />
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-inner">
        <canvas
          ref={canvasRef}
          width={760}
          height={400}
          className="w-full h-[360px] sm:h-[400px] cursor-crosshair touch-none block"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      <p className="text-[11px] text-gray-500 font-medium">
        Instrucciones: Seleccione una plantilla vial y haga clic sobre el plano para estampar vehículos, señales o el punto de impacto. Para dibujar trayectorias o huellas de frenado, mantenga presionado y arrastre el cursor.
      </p>
    </div>
  );
}
