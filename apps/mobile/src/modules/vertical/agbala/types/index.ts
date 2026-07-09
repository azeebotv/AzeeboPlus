export interface AgbalaCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  path: 'warrior' | 'sage' | 'trickster' | 'healer';
  unlocked: boolean;
}

export interface AgbalaQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AgbalaQuiz {
  id: string;
  title: string;
  description: string;
  questions: AgbalaQuizQuestion[];
  universe: string;
}

export interface AgbalaPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress: number;
  totalSteps: number;
}

export interface AgbalaStoryworld {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  characters: AgbalaCharacter[];
  paths: AgbalaPath[];
}

export interface AgbalaTheory {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  createdAt: string;
}

export interface AgbalaRoom {
  id: string;
  name: string;
  description: string;
  participantCount: number;
  isLive: boolean;
}

export type AgbalaStackParamList = {
  AgbalaHome: undefined;
  AgbalaStoryworld: undefined;
  AgbalaPath: { pathId: string };
  AgbalaQuiz: undefined;
  AgbalaQuizResult: { answers: number[] };
};
