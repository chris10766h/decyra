import React from 'react';
import { Mic, Upload, GraduationCap } from 'lucide-react';

interface EmptyStateProps {
  onStartRecording: () => void;
  onUpload: (file: File) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onStartRecording, onUpload }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-700">
      <div className="bg-slate-100 p-6 rounded-2xl mb-8 shadow-sm">
        <GraduationCap className="w-16 h-16 text-slate-400" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
        DECYRA
      </h2>
      <p className="text-slate-500 max-w-md mb-12 text-lg">
        Graba la clase. DECYRA la convierte en apuntes que sí dan ganas de estudiar.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={onStartRecording}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <Mic className="w-5 h-5" />
          <span>Grabar clase</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Upload className="w-5 h-5" />
          <span>Subir audio</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
      
      <div className="mt-12 grid grid-cols-3 gap-8 text-xs text-slate-400 font-medium uppercase tracking-wider">
        <div>Apuntes</div>
        <div>Síntesis</div>
        <div>Estudio</div>
      </div>
    </div>
  );
};