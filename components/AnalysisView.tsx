import React, { useState } from 'react';
import { DecyraAnalysis } from '../types';
import { BookOpen, FileText, Calendar, Share2, Copy, Bookmark, HelpCircle, MessageSquareQuote, CheckCircle2, Edit2, Save, X } from 'lucide-react';

interface AnalysisViewProps {
  analysis: DecyraAnalysis;
  title: string;
  onUpdate: (newAnalysis: DecyraAnalysis) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
      active
        ? 'bg-slate-900 text-white shadow-md'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    {icon}
    {children}
  </button>
);

// Helper component for editable sections
const EditableContent: React.FC<{
  title?: string;
  content: string;
  onSave: (newContent: string) => void;
  className?: string;
  textClassName?: string;
  headerIcon?: React.ReactNode;
}> = ({ title, content, onSave, className, textClassName, headerIcon }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(content);

  const handleSave = () => {
    onSave(tempContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempContent(content);
    setIsEditing(false);
  };

  return (
    <section className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-8 ${className}`}>
      {(title || headerIcon) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 overflow-hidden">
            {headerIcon}
            {title && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{title}</h3>}
          </div>
          {!isEditing && (
            <button 
              onClick={() => { setTempContent(content); setIsEditing(true); }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors shrink-0"
              title="Editar texto"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="animate-in fade-in duration-200">
          <textarea
            value={tempContent}
            onChange={(e) => setTempContent(e.target.value)}
            className="w-full min-h-[200px] p-4 bg-slate-50 border-2 border-indigo-100 rounded-lg focus:border-indigo-500 focus:ring-0 text-slate-800 leading-relaxed resize-y outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className={`prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-7 prose-li:text-slate-700 whitespace-pre-line ${textClassName}`}>
           {content.split('\n').map((paragraph, idx) => (
               paragraph.trim() ? <p key={idx} className="mb-4">{paragraph}</p> : null
           ))}
        </div>
      )}
    </section>
  );
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, title, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'transcript'>('notes');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 flex items-center justify-between bg-white shrink-0">
        <div className="overflow-hidden">
          <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate pr-2">{title}</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 truncate">Apuntes de Clase • Generado por DECYRA</p>
        </div>
        <div className="flex gap-1 md:gap-2 shrink-0">
           <button 
             onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}
             className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50" title="Copiar JSON"
            >
             <Copy className="w-5 h-5" />
           </button>
           <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50" title="Exportar">
             <Share2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 border-b border-slate-100 flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <TabButton 
          active={activeTab === 'notes'} 
          onClick={() => setActiveTab('notes')}
          icon={<BookOpen className="w-4 h-4" />}
        >
          Apuntes
        </TabButton>
        <TabButton 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')}
          icon={<Calendar className="w-4 h-4" />}
        >
          Tareas ({analysis.classTasks.length})
        </TabButton>
        <TabButton 
          active={activeTab === 'transcript'} 
          onClick={() => setActiveTab('transcript')}
          icon={<FileText className="w-4 h-4" />}
        >
          Transcripción
        </TabButton>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto pb-20 md:pb-0">
          
          {activeTab === 'notes' && (
            <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Resumen Académico Editable */}
              <EditableContent
                title="Resumen de la Clase"
                content={analysis.academicSummary}
                onSave={(text) => onUpdate({...analysis, academicSummary: text})}
                textClassName="text-base md:text-lg font-medium text-slate-800"
              />

              {/* Conceptos Clave */}
              {analysis.keyConcepts.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Bookmark className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-lg">Conceptos Clave</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.keyConcepts.map((concept, idx) => (
                            <div key={idx} className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-indigo-900 mb-2">{concept.term}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{concept.definition}</p>
                            </div>
                        ))}
                    </div>
                </section>
              )}

              {/* Desarrollo Explicado Editable */}
              <EditableContent
                className="relative overflow-hidden"
                content={analysis.detailedNotes}
                onSave={(text) => onUpdate({...analysis, detailedNotes: text})}
                headerIcon={<h3 className="text-xl md:text-2xl font-bold text-slate-900 font-serif">Desarrollo de la Clase</h3>}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 {/* Examples */}
                 {analysis.examples.length > 0 && (
                     <section className="bg-amber-50 rounded-xl border border-amber-100 p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4 text-amber-700">
                           <MessageSquareQuote className="w-5 h-5" />
                           <h3 className="font-bold text-amber-900">Ejemplos y Casos</h3>
                        </div>
                        <ul className="space-y-3">
                          {analysis.examples.map((ex, idx) => (
                            <li key={idx} className="flex gap-3 text-amber-800 text-sm">
                                <span className="block w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                                <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                     </section>
                 )}

                 {/* Exam Questions/Doubts */}
                 {analysis.studyQuestions.length > 0 && (
                     <section className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4 text-indigo-700">
                           <HelpCircle className="w-5 h-5" />
                           <h3 className="font-bold text-indigo-900">Preguntas de Repaso</h3>
                        </div>
                        <ul className="space-y-3">
                          {analysis.studyQuestions.map((q, idx) => (
                            <li key={idx} className="flex gap-3 text-indigo-800 text-sm font-medium">
                                <span className="text-indigo-400 font-bold">?</span>
                                <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                     </section>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
             <div className="animate-in fade-in duration-300">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                   <div className="flex items-center gap-3 mb-6">
                      <Calendar className="w-6 h-6 text-slate-900" />
                      <h2 className="text-xl font-bold text-slate-900">Tareas y Fechas</h2>
                   </div>
                   
                   {analysis.classTasks.length === 0 ? (
                       <div className="text-center py-12 text-slate-400">
                           <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                           <p>No se detectaron tareas o fechas importantes en esta clase.</p>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           {analysis.classTasks.map((task, idx) => (
                               <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                   <div className="flex items-start gap-3 mb-2 sm:mb-0">
                                       <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                           task.type === 'Examen' ? 'bg-red-500' : 
                                           task.type === 'Tarea' ? 'bg-blue-500' : 'bg-slate-400'
                                       }`} />
                                       <div>
                                           <p className="font-medium text-slate-900">{task.task}</p>
                                           <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">{task.type}</p>
                                       </div>
                                   </div>
                                   {task.date && (
                                       <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 font-mono whitespace-nowrap">
                                           <Calendar className="w-3 h-3" />
                                           {task.date}
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'transcript' && (
             <div className="animate-in fade-in duration-500">
                <EditableContent
                  title="Transcripción Completa"
                  content={analysis.transcript}
                  onSave={(text) => onUpdate({...analysis, transcript: text})}
                  textClassName="text-slate-700 leading-7 text-sm md:text-base"
                />
             </div>
          )}

        </div>
      </div>
    </div>
  );
};