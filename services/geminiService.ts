
import { GoogleGenAI, Chat } from "@google/genai";
import { UserInfo, InterpersonalScores, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzePropensity = async (userInfo: UserInfo, scores: InterpersonalScores) => {
  const prompt = `
    당신은 기업 인사 및 리더십 커뮤니케이션 전문가입니다. 다음 리더의 FIRO-B(대인관계지향성 진단) 결과를 분석해주세요.
    
    리더 정보:
    - 성명: ${userInfo.name}
    - 직급: ${userInfo.rank}
    - 직책: ${userInfo.position}
    
    FIRO-B 진단 점수 (각 0~9점):
    1. 포함 욕구 - 표출(Expressed Inclusion): ${scores.inclusionExpressed}
    2. 포함 욕구 - 기대(Wanted Inclusion): ${scores.inclusionWanted}
    3. 통제 욕구 - 표출(Expressed Control): ${scores.controlExpressed}
    4. 통제 욕구 - 기대(Wanted Control): ${scores.controlWanted}
    5. 애정 욕구 - 표출(Expressed Affection): ${scores.affectionExpressed}
    6. 애정 욕구 - 기대(Wanted Affection): ${scores.affectionWanted}
    
    분석 요청 사항:
    1. [기본 성향] 각 영역(포함, 통제, 애정)의 표출/기대 점수 차이를 바탕으로 한 대인관계 특징.
    2. [리더십 스타일] 리더로서 팀을 이끌 때 나타나는 의사결정 방식과 영향력 행사 스타일.
    3. [성과 피드백 패턴] 성과 면담 시 이 리더가 선호하거나 주의해야 할 커뮤니케이션 습관. 
       - 특히 '통제' 욕구 점수를 바탕으로 피드백의 주도성/수용성을 분석하세요.
    4. [수행공학적 제언] 길버트의 6박스 모델을 활용하여, 팀원의 성과를 높이기 위해 환경적으로 지원해야 할 요소.
    
    답변 가이드:
    - FIRO-B 전문 용어를 적절히 사용하여 신뢰감을 주되, 이해하기 쉽게 풀어서 설명하세요.
    - 마크다운 형식을 활용하여 가독성 있게 작성해주세요.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });

  return response.text;
};

export const startSimulationChat = (userInfo: UserInfo, scores: InterpersonalScores): Chat => {
  const systemInstruction = `
    당신은 리더 '${userInfo.name}'(${userInfo.rank}/${userInfo.position})의 팀원 '박지민 대리'입니다.
    현재 상황은 분기 성과 중간 점검 면담입니다.
    
    [팀원 페르소나]
    - 성격: 자신의 업무에 책임감이 강하지만, 최근 업무 가이드가 모호하여 방향을 잡는 데 어려움을 겪고 있음. 
    - 태도: 리더의 FIRO-B 성향(${JSON.stringify(scores)})에 예민하게 반응합니다.
      - 리더의 Expressed Control(통제-표출)이 높으면: 조금은 긴장한 상태로 리더의 지시를 경청합니다.
      - 리더의 Expressed Affection(애정-표출)이 낮으면: 정서적 지지보다는 명확한 정보와 보상을 원합니다.
    - 반응 가이드:
      - 리더가 질문하면 성실히 답하되, (속마음: ...)을 통해 현재의 고민(자원 부족, 정보 단절 등)을 드러내세요.
      - 대화가 진행됨에 따라 리더가 수행공학적 관점(6박스 모델: 정보, 도구, 보상 등)을 언급하는지 살피세요.
    
    [대화 규칙]
    - 리더가 먼저 대화를 시작할 것입니다.
    - 답변은 리더의 말에 자연스럽게 이어지도록 하며, 단답형보다는 2~3문장으로 구성하세요.
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      temperature: 0.8,
    },
  });
};

export const evaluateFeedback = async (history: ChatMessage[], userInfo: UserInfo) => {
  const conversation = history.map(h => `${h.role === 'user' ? '리더' : '팀원'}: ${h.content}`).join('\n');
  
  const prompt = `
    당신은 리더십 및 성과관리 전문가입니다. 방금 진행된 리더 '${userInfo.name}'와 팀원 간의 성과면담 대화를 분석하고 진단 보고서를 작성하십시오.
    
    [분석 대상 대화]
    ${conversation}
    
    [전문가 진단 기준]
    1. 대화 구조: 성과면담(GROW) 또는 피드백(FTA) 모델의 단계별 진행이 매끄러운가?
    2. 수행공학(6박스 모델): 성과의 원인을 개인의 태도뿐만 아니라 환경적 지원(도구, 정보, 보상 등) 측면에서 다각도로 접근했는가?
    3. 소통 태도: 인정과 격려가 충분한가? 구성원이 스스로 생각하도록 유도하는 개방형 질문을 사용하는가?
    4. 미래 지향성: 과거의 잘못을 지적하기보다 미래의 행동 변화와 지원책을 합의했는가?
    
    [보고서 구성]
    - [종합 진단] 이번 면담의 전반적인 수준과 핵심 평가.
    - [Good Points] 효과적이었던 질문이나 멘트 (인용 필수).
    - [Improvement] 개선이 필요한 부분과 그 이유, 그리고 '수정된 멘트 예시(Before/After)'.
    - [Leadership Action Item] 리더를 위한 향후 3가지 실천 과제.
    
    정중하면서도 예리한 컨설턴트의 시각으로 작성해 주세요.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });

  return response.text;
};
