
export interface UserInfo {
  name: string;
  rank: string;
  position: string;
}

export interface InterpersonalScores {
  inclusionExpressed: number; // 포함 - 표출 (EI)
  inclusionWanted: number;    // 포함 - 기대 (WI)
  controlExpressed: number;   // 통제 - 표출 (EC)
  controlWanted: number;      // 통제 - 기대 (WC)
  affectionExpressed: number; // 애정 - 표출 (EA)
  affectionWanted: number;    // 애정 - 기대 (WA)
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export enum AppStep {
  USER_INFO = 'USER_INFO',
  SCORE_INPUT = 'SCORE_INPUT',
  ANALYSIS = 'ANALYSIS',
  SIMULATION = 'SIMULATION',
  EVALUATION = 'EVALUATION'
}
