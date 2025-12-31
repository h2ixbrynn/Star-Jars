export type Language = 'en' | 'zh';

export interface StarNote {
  id: string;
  content: string; // The short note written on the paper
  date: string; // ISO date string
  color: string; // Hex code for the star color
  rotation: number; // Random rotation for visual variety in the jar
  x: number; // Random X position in the jar (0-100%)
  y: number; // Random Y position in the jar (accumulates at bottom)
}

export type JarShape = 
  | 'mason' 
  | 'bottle' 
  | 'heart' 
  | 'star' 
  | 'bowl' 
  | 'cat' 
  | 'cloud' 
  | 'moon' 
  | 'flower' 
  | 'book' 
  | 'dumbbell' 
  | 'bulb' 
  | 'money'
  | 'abstract-1'
  | 'abstract-2'
  | 'abstract-3';

export interface Jar {
  id: string;
  name: string; // The habit or idea name (e.g., "Workout")
  description?: string;
  createdAt: string;
  stars: StarNote[];
  themeColor: string; // The primary color for this jar's stars
  shape: JarShape; // The visual shape of the container
  shelf?: string; // The name of the shelf this jar belongs to
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  JAR_DETAIL = 'JAR_DETAIL',
  STATS = 'STATS', // New view for statistics
}