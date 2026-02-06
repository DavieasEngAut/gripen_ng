import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Timer, Trophy, Activity, Settings, X } from 'lucide-react';

export default function AssettoDash({ onBack }: { onBack: () => void }) {
  const [serverIp, setServerIp] = useState(localStorage.getItem('niobio-ip') || 'localhost');
  const [showSettings, setShowSettings] = useState(false);
  const [tempIp, setTempIp] = useState(serverIp);
  const [data, setData] = useState({ speed: 0, rpm: 0, gear: 'N', fuel: 0, lastLap: '--:--.---', bestLap: '--:--.---', status: 'OFFLINE' });

  useEffect(() => {
    const ws = new WebSocket(`ws://${serverIp}:8112/telemetry`);
    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);
        const gearMap = ['R', 'N', '1', '2', '3', '4', '5', '6', '7', '8'];
        setData(prev => ({ ...prev, ...json, gear: gearMap[json.gear] || 'N', status: 'ACTIVE' }));
      } catch (e) { console.error(e); }
    };
    ws.onclose = () => setData(prev => ({ ...prev, status: 'DISCONNECTED' }));
    return () => ws.close();
  }, [serverIp]);

  const isRedline = data.rpm > 7800;

  return (
    <div className={`h-screen transition-colors duration-150 ${isRedline ? 'bg-red-950/20' : 'bg-black'} text-yellow-500 font-mono p-12 flex flex-col justify-between select-none relative`}>
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md border-2 border-yellow-500 p-8 bg-neutral-900 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
              <h2 className="text-xl font-black italic mb-8 uppercase">Config_System</h2>
              <input type="text" value={tempIp} onChange={(e) => setTempIp(e.target.value)} className="w-full bg-black border border-yellow-900/50 p-4 text-yellow-500 mb-6 font-bold outline-none" placeholder="127.0.0.1"/>
              <button onClick={() => { localStorage.setItem('niobio-ip', tempIp); setServerIp(tempIp); setShowSettings(false); }} className="w-full bg-yellow-500 text-black font-black py-4 uppercase text-sm">Save & Sync</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-start">
        <button onClick={onBack} className="opacity-50 hover:opacity-100 italic text-sm">{"< RETURN_TO_GARAGE"}</button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] opacity-40 italic font-bold">
            <Activity size={10} className={data.status === 'ACTIVE' ? 'text-green-500 animate-pulse' : 'text-red-500'} />
            {serverIp} // {data.status}
          </div>
          <button onClick={() => setShowSettings(true)} className="opacity-40 hover:opacity-100"><Settings size={18} /></button>
        </div>
      </div>

      <div className="flex justify-center items-center gap-20">
        <div className="text-center">
          <p className="text-[10px] opacity-30 mb-[-10px]">KM/H</p>
          <p className="text-9xl font-black italic tracking-tighter">{data.speed}</p>
        </div>
        <div className={`w-[220px] h-[220px] border-4 ${isRedline ? 'border-red-500 shadow-[0_0_60px_rgba(220,38,38,0.4)]' : 'border-yellow-500'} rounded-full flex items-center justify-center`}>
          <span className={`text-[130px] font-black ${isRedline ? 'text-red-500' : ''}`}>{data.gear}</span>
        </div>
      </div>

      <div className="relative pt-10">
        <div className="absolute top-0 left-0 text-[10px] opacity-50 font-bold">ENGINE RPM // {data.rpm}</div>
        <div className="w-full h-10 bg-neutral-900 border border-yellow-900/20 overflow-hidden">
          <motion.div animate={{ width: `${(data.rpm / 8500) * 100}%` }} transition={{ type: "spring", stiffness: 400, damping: 40 }} className={`h-full ${isRedline ? 'bg-red-600 shadow-[0_0_30px_#dc2626]' : 'bg-yellow-500 shadow-[0_0_20px_#eab308]'}`} />
        </div>
      </div>
      <div className="absolute bottom-4 right-8 opacity-20 text-[10px] tracking-[5px] font-black italic">NIOBIO RACE SYSTEMS</div>
    </div>
  );
}