import { Session } from "../types";

const DATA_PREFIX = 'decyra_data_';

export const storageService = {
  saveSessions: (userId: string, sessions: Session[]) => {
    // We filter out the audioBlob because LocalStorage has a size limit (usually 5MB)
    // Storing audio files would crash the app. We persist the text analysis.
    const sessionsToSave = sessions.map(s => {
      const { audioBlob, ...rest } = s;
      return rest;
    });
    
    localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(sessionsToSave));
  },

  loadSessions: (userId: string): Session[] => {
    const data = localStorage.getItem(`${DATA_PREFIX}${userId}`);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data);
      // Restore Date objects
      return parsed.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
    } catch (e) {
      console.error("Error loading sessions", e);
      return [];
    }
  }
};