export interface Match {
  matchId: number;
  gamedayId: number;
  circuitLocation: string;
  circuitShortName: string;
  season: number;
  status: number;
}

export interface Option {
  optionId: number;
  optionDesc: string;
  points: number;
  position: number;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  questionNo: number;
  questionDescription: string;
  questionType: string;
  choiceLimit: number;
  questionStatus: number;
  matchId: number;
  options: Option[];
}