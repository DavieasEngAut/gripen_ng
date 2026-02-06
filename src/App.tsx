import { useState } from 'react';
import GripenHUD from './components/GripenHUD';
import AssettoDash from './components/AssettoDash';

export default function App() {
  const [mode, setMode] = useState<'MENU' | 'GRIPEN' | 'ASSETTO'>('MENU');

  if (mode === 'GRIPEN') return <GripenHUD onBack={() => setMode('MENU')} />;
  if (mode === 'ASSETTO') return <AssettoDash onBack={() => setMode('MENU')} />;

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-8 font-mono">
      <h1 className="text-cyan-500 text-4xl font-black tracking-[10px] italic">NIOBIO LABS</h1>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setMode('GRIPEN')}
          className="border-2 border-cyan-500 text-cyan-500 px-8 py-4 hover:bg-cyan-500 hover:text-black transition-all font-bold"
        >
          FLIGHT SYSTEMS (F-39)
        </button>
        
        <button 
          onClick={() => setMode('ASSETTO')}
          className="border-2 border-yellow-500 text-yellow-500 px-8 py-4 hover:bg-yellow-500 hover:text-black transition-all font-bold"
        >
          RACE TELEMETRY (AC)
        </button>
      </div>
    </div>
  );
}