import { Jar } from '../types';

const STORAGE_KEY = 'starjar_data_v1';

export const loadJars = (): Jar[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load jars", error);
    return [];
  }
};

export const saveJars = (jars: Jar[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jars));
  } catch (error) {
    console.error("Failed to save jars", error);
  }
};