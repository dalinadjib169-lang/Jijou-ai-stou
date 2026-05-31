export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface SystemSettings {
  profileImageUrl: string;
  welcomeMessage: string;
  apiKeys: string[];
}

export interface MathFunctionAnalysis {
  expression: string;
  derivative: string;
  criticalPoints: { x: number; y: number; type: string }[];
  yIntercept: number | null;
  obliqueAsymptote: string;
  verticalAsymptotes: number[];
  forbiddenValues: number[];
}
