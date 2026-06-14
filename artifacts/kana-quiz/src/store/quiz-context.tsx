import { createContext, useContext, useState, ReactNode } from 'react';
import { KanaChar } from '../data/kana';

export type QuizSettings = {
  name: string;
  discord?: string;
  mode: 'hiragana' | 'katakana' | 'mixed';
  quizMode: 'multiple-choice' | 'typing';
  questionCount: number | 'all';
};

export type AnswerRecord = {
  kana: string;
  reading: string;
  userAnswer: string;
  correct: boolean;
};

type QuizContextType = {
  settings: QuizSettings | null;
  setSettings: (settings: QuizSettings) => void;
  questions: KanaChar[];
  setQuestions: (q: KanaChar[]) => void;
  answers: AnswerRecord[];
  addAnswer: (ans: AnswerRecord) => void;
  timeTaken: number;
  setTimeTaken: (t: number) => void;
  shareId: number | null;
  setShareId: (id: number | null) => void;
  resetQuiz: () => void;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<KanaChar[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [shareId, setShareId] = useState<number | null>(null);

  const addAnswer = (ans: AnswerRecord) => {
    setAnswers(prev => [...prev, ans]);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setAnswers([]);
    setTimeTaken(0);
    setShareId(null);
  };

  return (
    <QuizContext.Provider value={{
      settings, setSettings,
      questions, setQuestions,
      answers, addAnswer,
      timeTaken, setTimeTaken,
      shareId, setShareId,
      resetQuiz
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuizContext must be used within QuizProvider");
  return ctx;
}
