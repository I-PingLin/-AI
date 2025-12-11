import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface FactCheckResult {
  sentence: string;
  isGrounded: boolean;
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // This is a placeholder for the API key.
    // In a real Applet environment, process.env.API_KEY would be available.
    const apiKey = (process.env as any).API_KEY;
    if (!apiKey) {
      console.error("API_KEY is not set in the environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async factCheck(llmResponse: string, knowledgeBase: string): Promise<FactCheckResult[]> {
    const prompt = `
あなたは高度なファクトチェックAIです。
以下の「ナレッジベース」のみを信頼できる唯一の情報源として使用してください。
「LLMの回答」を文単位に分解し、各文が「ナレッジベース」の情報によって完全に裏付けられているかどうかを判定してください。
意味が同じでも、表現が少し違う程度であれば「根拠あり」と判断してください。
「ナレッジベース」に全く記載がない情報や、矛盾する情報が含まれている場合は「根拠なし」と判断してください。

判定結果は、必ず指定されたJSONスキーマに従って返してください。

# ナレッジベース
${knowledgeBase}

# LLMの回答
${llmResponse}
`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sentence: {
            type: Type.STRING,
            description: '「LLMの回答」から抽出した元の文。',
          },
          isGrounded: {
            type: Type.BOOLEAN,
            description: 'その文が「ナレッジベース」によって裏付けられている場合は true、そうでない場合は false。',
          },
          reason: {
            type: Type.STRING,
            description: '判定の簡単な理由（例：「ナレッジベースの製品概要と一致」、「ナレッジベースに記載なし」など）。',
          },
        },
        required: ['sentence', 'isGrounded', 'reason'],
      },
    };
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        },
      });

      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText) as FactCheckResult[];
      return result;

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
             throw new Error('APIキーが無効です。正しいAPIキーが設定されているか確認してください。');
        }
        throw new Error('AIとの通信中にエラーが発生しました。入力内容を確認するか、時間をおいて再試行してください。');
    }
  }
}
