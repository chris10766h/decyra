import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DecyraAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcript: {
      type: Type.STRING,
      description: "A faithful, full transcription of the class/lecture.",
    },
    academicSummary: {
      type: Type.STRING,
      description: "A clear, academic summary of what the class was about (1-2 paragraphs). Useful for quick review.",
    },
    keyConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "The concept, term, or principle name." },
          definition: { type: Type.STRING, description: "A clear definition or explanation of the term based on the lecture." }
        },
        required: ["term", "definition"]
      },
      description: "Key concepts, definitions, models, or formulas discussed.",
    },
    detailedNotes: {
      type: Type.STRING,
      description: "Comprehensive, well-structured study notes rewriting the lecture content. Organize chronologically or logically. Use clear academic language, removing fillers and speech errors. This is the main study material.",
    },
    examples: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific examples, case studies, or analogies mentioned by the professor to explain concepts.",
    },
    studyQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Potential exam questions, doubts raised in class, or complex points that require further review.",
    },
    classTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING, description: "The specific homework, reading, or exam." },
          type: { type: Type.STRING, enum: ["Tarea", "Examen", "Lectura", "Otro"] },
          date: { type: Type.STRING, description: "Due date if mentioned, otherwise leave empty." }
        },
        required: ["task", "type"]
      },
      description: "Administrative items like homework, exam dates, or required readings.",
    }
  },
  required: ["transcript", "academicSummary", "keyConcepts", "detailedNotes", "examples", "studyQuestions", "classTasks"]
};

export const analyzeAudio = async (base64Audio: string, mimeType: string): Promise<DecyraAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `Actúa como DECYRA, un experto tomador de apuntes universitarios.
            
            Tu objetivo: Transformar el audio de una clase en material de estudio perfecto.
            
            Instrucciones específicas:
            1. Transcribe el audio fielmente.
            2. Genera apuntes estructurados (NO un simple resumen, sino una reescritura académica del contenido).
            3. Identifica conceptos clave y defínelos.
            4. Captura ejemplos y analogías que ayuden a estudiar.
            5. Detecta posibles preguntas de examen o dudas.
            
            Estilo: Académico, claro, directo, sin muletillas, organizado para estudiar.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as DecyraAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeText = async (transcriptText: string): Promise<DecyraAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            text: `Actúa como DECYRA. He corregido la transcripción de una clase y necesito que regeneres los apuntes basándote en este nuevo texto.
            
            TEXTO DE LA CLASE:
            "${transcriptText}"
            
            Instrucciones:
            1. Mantén la transcripción tal cual se te ha pasado (es la versión corregida).
            2. Regenera el Resumen Académico basándote en esta nueva versión.
            3. Regenera los Conceptos Clave y Definiciones.
            4. Reescribe el "Desarrollo de la Clase" (Detailed Notes) para que coincida perfectamente con el nuevo contenido.
            5. Actualiza tareas y preguntas de examen.
            
            Output en JSON estricto.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as DecyraAnalysis;

  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    throw error;
  }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};