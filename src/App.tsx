import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {Settings, X, Globe, AlertCircle } from 'lucide-react';

interface Telemetry {
  roll: number; pitch: number; ias: number; alt: number; oilTemp: number;
}

export default function App() {
  const [serverIp, setServerIp] = useState(localStorage.getItem('niobio-ip') || 'localhost');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [status, setStatus] = useState<'OFFLINE' | 'CONNECTED'>('OFFLINE');

  // Lógica de Combate: Oil Temp > 100°C
  const isCombatMode = (telemetry?.oilTemp ?? 0) > 100;
  const themeColor = isCombatMode ? 'text-red-500' : 'text-cyan-400';
  const borderColor = isCombatMode ? 'border-red-900/50' : 'border-cyan-900/50';
  const glowColor = isCombatMode ? 'shadow-red-500' : 'shadow-cyan-400';

  useEffect(() => {
    const fetchWT = async () => {
      try {
        const res = await fetch(`http://${serverIp}:8111/state`);
        const data = await res.json();
        
        // Calibragem dos sensores: Extração direta das chaves do War Thunder
        setTelemetry({
          roll: data["bank, deg"] || 0,
          pitch: data["pitch, deg"] || 0,
          ias: data["IAS, km/h"] || 0,
          alt: data["H, m"] || 0,
          oilTemp: data["oil temp 1, C"] || 0
        });
        setStatus('CONNECTED');
      } catch (e) {
        setStatus('OFFLINE');
        // Valores de teste para ver o horizonte funcionando mesmo offline
        setTelemetry({ roll: 0, pitch: 0, ias: 0, alt: 0, oilTemp: 0 });
      }
    };
    const timer = setInterval(fetchWT, 100);
    return () => clearInterval(timer);
  }, [serverIp]);

  if (!telemetry) return <div className="bg-black h-screen" />;

  return (
    <div className={`h-screen w-full bg-black ${themeColor} font-mono overflow-hidden relative select-none transition-colors duration-500`}>
      
      {/* 🟢 HORIZONTE ARTIFICIAL CALIBRADO */}
      {/* Sensibilidade: 1 grau de pitch = 15 pixels de deslocamento vertical */}
      <motion.div 
        animate={{ 
          rotate: -telemetry.roll, 
          y: telemetry.pitch * 15 
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {/* Linha de Referência Central */}
        <div className={`w-[600px] h-[2px] bg-current ${glowColor} shadow-[0_0_20px_rgba(34,211,238,0.5)]`} />
        
        {/* Escada de Arfagem (Pitch Ladder) */}
        <div className="absolute flex flex-col gap-24 opacity-30">
          {[30, 20, 10, 0, -10, -20, -30].map(deg => (
            <div key={deg} className="flex items-center gap-6">
              <div className="w-12 h-[1px] bg-current" />
              <span className="text-[10px] font-bold">{deg}</span>
              <div className="w-12 h-[1px] bg-current" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ⚠️ ALERTA DE COMBATE / OVERHEAT */}
      {isCombatMode && (
        <motion.div 
          animate={{ opacity: [0, 1, 0] }} 
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 text-black px-6 py-2 font-black rounded"
        >
          <AlertCircle size={20} /> MASTER WARNING: ENGINE OVERHEAT
        </motion.div>
      )}

      {/* 📊 INSTRUMENTOS LATERAIS */}
      <div className={`absolute left-12 top-1/2 -translate-y-1/2 flex flex-col items-end border-r ${borderColor} pr-6 transition-colors`}>
        <span className="text-[10px] opacity-50 font-bold mb-2 uppercase tracking-widest">Speed IAS</span>
        <span className="text-8xl font-black italic tracking-tighter">{Math.round(telemetry.ias)}</span>
      </div>

      <div className={`absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-start border-l ${borderColor} pl-6 transition-colors`}>
        <span className="text-[10px] opacity-50 font-bold mb-2 uppercase tracking-widest">Altitude M</span>
        <span className="text-8xl font-black italic tracking-tighter">{Math.round(telemetry.alt)}</span>
      </div>

      {/* 🛠️ RODAPÉ NIOBIO LABS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <h2 className="text-2xl font-black tracking-[15px] uppercase italic opacity-80">Niobio Labs</h2>
        <div className="flex gap-4 mt-2 opacity-40 text-[8px] tracking-[4px]">
          <span>STATION: LEOPOLDINA</span>
          <span>PILOT: SANTANA</span>
        </div>
      </div>

      {/* CONFIG & STATUS (Mantenha igual ao anterior) */}
      <div className="absolute top-6 left-6 flex items-center gap-2 opacity-40">
        <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px]">{status} | {serverIp} | {Math.round(telemetry.oilTemp)}°C</span>
      </div>

      <button onClick={() => setIsConfigOpen(true)} className="absolute top-6 right-6 opacity-30 hover:opacity-100 transition-opacity">
        <Settings size={20} />
      </button>

      {/* MODAL DE CONFIGURAÇÃO (Oculto por padrão) */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="bg-neutral-900 p-8 border border-cyan-900 rounded-xl w-80 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-cyan-950 pb-4">
                <h3 className="text-cyan-400 font-bold text-sm flex items-center gap-2"><Globe size={16}/> SET TARGET IP</h3>
                <button onClick={() => setIsConfigOpen(false)}><X size={18} /></button>
              </div>
              <input 
                type="text" className="bg-black border border-cyan-900 p-3 text-cyan-400 outline-none"
                value={serverIp} onChange={(e) => { setServerIp(e.target.value); localStorage.setItem('niobio-ip', e.target.value); }}
              />
              <button onClick={() => setIsConfigOpen(false)} className="bg-cyan-600 text-black font-black py-3 rounded">CONFIRM LINK</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}