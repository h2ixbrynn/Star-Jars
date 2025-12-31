import { GoogleGenAI } from "@google/genai";
import { Jar, JarShape, Language } from "../types";

// Initialize Gemini AI
// NOTE: Process.env.API_KEY is handled by the build environment/runtime.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReflection = async (jar: Jar, language: Language = 'en'): Promise<string> => {
  try {
    if (jar.stars.length === 0) {
      return language === 'zh' 
        ? "这个瓶子还是空的。开始折星星来创造回忆吧！" 
        : "This jar is empty. Start folding stars to create memories!";
    }

    const notes = jar.stars.map(s => `- ${new Date(s.date).toLocaleDateString()}: ${s.content}`).join('\n');
    
    const langInstruction = language === 'zh' 
      ? "Please write the response in Simplified Chinese (Mandarin). Use a gentle, warm, and poetic tone." 
      : "Please write the response in English. Use a gentle, warm, and poetic tone.";

    const prompt = `
      I am collecting "star memories" for a habit or idea called "${jar.name}".
      Here are the notes I've written inside the folded paper stars in my jar:
      ${notes}

      Please provide a gentle, poetic, and encouraging reflection on my progress. 
      ${langInstruction}
      Analyze the frequency and content to tell me a short story about my journey with this habit.
      Keep it under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || (language === 'zh' ? "云层太厚，我看不到星星了。" : "I couldn't read the stars today, but keep shining.");
  } catch (error) {
    console.error("Gemini Reflection Error:", error);
    return language === 'zh' ? "请稍后再试。" : "The stars are cloudy right now. Please try reflecting again later.";
  }
};

export const suggestJarShape = async (habitName: string): Promise<JarShape> => {
  try {
    const prompt = `
      I am creating a habit tracker app where habits are stored in jars.
      The habit name is: "${habitName}".
      
      Available jar shapes are:
      - 'cat' (for pets, animals, playful, curious)
      - 'cloud' (for dreams, sleep, sky, peace)
      - 'moon' (for night, sleep, mystery, cycles)
      - 'flower' (for growth, nature, beauty, gardening)
      - 'book' (for reading, study, knowledge)
      - 'dumbbell' (for gym, strength, workout)
      - 'bulb' (for ideas, creativity, innovation)
      - 'money' (for savings, finance, wealth)
      - 'bottle' (for hydration, sports, liquid)
      - 'heart' (for love, gratitude, relationships)
      - 'star' (for achievements, goals, brilliance)
      - 'bowl' (for mindfulness, food, cooking)
      - 'mason' (default, general purpose)
      
      If the habit is abstract or doesn't fit a specific object well, choose one of these organic abstract shapes to ensure variety:
      - 'abstract-1' (tall organic curve)
      - 'abstract-2' (wide organic curve)
      - 'abstract-3' (quirky organic curve)

      Return ONLY the string of the shape name that best fits the habit. 
      Example Output: bottle
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text?.trim().toLowerCase();
    
    const validShapes: JarShape[] = [
        'mason', 'bottle', 'heart', 'star', 'bowl', 'cat', 'cloud', 'moon', 'flower', 'book', 'dumbbell', 'bulb', 'money', 'abstract-1', 'abstract-2', 'abstract-3'
    ];

    if (text && validShapes.includes(text as JarShape)) {
        return text as JarShape;
    }
    
    // Fallback: Pick a random abstract shape if AI fails or returns weird text
    const abstracts: JarShape[] = ['abstract-1', 'abstract-2', 'abstract-3', 'mason'];
    return abstracts[Math.floor(Math.random() * abstracts.length)];

  } catch (error) {
    console.error("Gemini Shape Error:", error);
    return 'abstract-1'; // Fallback
  }
};