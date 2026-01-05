export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DecyraAnalysis {
  transcript: string;
  academicSummary: string; // Resumen académico (1-2 paragraphs)
  keyConcepts: { term: string; definition: string }[]; // Ideas clave / Definiciones
  detailedNotes: string; // Desarrollo explicado (Rewritten lecture notes)
  examples: string[]; // Ejemplos y aclaraciones
  studyQuestions: string[]; // Preguntas, dudas y puntos de repaso
  classTasks: { task: string; type: 'Tarea' | 'Examen' | 'Lectura' | 'Otro'; date?: string }[]; // Tareas académicas
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface Session {
  id: string;
  title: string;
  date: Date;
  durationSeconds: number;
  status: ProcessingStatus;
  analysis?: DecyraAnalysis;
  audioBlob?: Blob; // Note: Not persisted in localStorage due to size limits
}