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
