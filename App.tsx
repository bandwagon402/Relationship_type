
import React, { useState, useEffect, useRef } from 'react';
import { UserInfo, InterpersonalScores, AppStep, ChatMessage } from './types';
import Layout from './components/Layout';
import ScoreInput from './components/ScoreInput';
import { analyzePropensity, startSimulationChat, evaluateFeedback } from './services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Send, User, ChevronRight, MessageCircle, ClipboardCheck, Sparkles, Loader2, Award, Zap, Info } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.USER_INFO);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', rank: '', position: '' });
  const [scores, setScores] = useState<InterpersonalScores>({
    inclusionExpressed: 4,
    inclusionWanted: 4,
    controlExpressed: 4,
    controlWanted: 4,
    affectionExpressed: 4,
    affectionWanted: 4,
  });
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [evaluation, setEvaluation] = useState('');
  
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.name && userInfo.rank && userInfo.position) {
      setStep(AppStep.SCORE_INPUT);
    }
  };

  const handleScoreSubmit = async () => {
    setIsLoading(true);
    setStep(AppStep.ANALYSIS);
    try {
      const result = await analyzePropensity(userInfo, scores);
      setAnalysis(result || '분석 결과를 생성하는 데 실패했습니다.');
    } catch (error) {
      console.error(error);
      setAnalysis('오류가 발생했습니다. AI 모델 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSimulation = () => {
    setChatHistory([{
      role: 'model',
      content: `${userInfo.name} ${userInfo.position}님, 안녕하세요. 박지민 대리입니다. 면담 시작하신다고 해서 자리 비워두고 기다리고 있었습니다. (속마음: 이번 면담에서 제 업무상의 고충을 얼마나 말씀드려도 될지 고민되네요...)`,
      timestamp: Date.now()
    }]);
    chatRef.current = startSimulationChat(userInfo, scores);
    setStep(AppStep.SIMULATION);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      if (chatRef.current) {
        const response = await chatRef.current.sendMessage({ message: userInput });
        const modelMsg: ChatMessage = {
          role: 'model',
          content: response.text || '...',
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, modelMsg]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSimulation = async () => {
    setIsLoading(true);
    setStep(AppStep.EVALUATION);
    try {
      const result = await evaluateFeedback(chatHistory, userInfo);
      setEvaluation(result || '평가 리포트 생성에 실패했습니다.');
    } catch (error) {
      console.error(error);
      setEvaluation('진단 과정에서 기술적인 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = [
    { subject: '포함(표출)', A: scores.inclusionExpressed },
    { subject: '포함(기대)', A: scores.inclusionWanted },
    { subject: '통제(표출)', A: scores.controlExpressed },
    { subject: '통제(기대)', A: scores.controlWanted },
    { subject: '애정(표출)', A: scores.affectionExpressed },
    { subject: '애정(기대)', A: scores.affectionWanted },
  ];

  const resetAll = () => {
    setStep(AppStep.USER_INFO);
    setUserInfo({ name: '', rank: '', position: '' });
    setScores({
      inclusionExpressed: 4,
      inclusionWanted: 4,
      controlExpressed: 4,
      controlWanted: 4,
      affectionExpressed: 4,
      affectionWanted: 4,
    });
    setChatHistory([]);
    setAnalysis('');
    setEvaluation('');
  };

  return (
    <Layout title="리더 FIRO-B 피드백 솔루션" onReset={resetAll}>
      {/* Step 1: User Info */}
      {step === AppStep.USER_INFO && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-2xl mb-4 border border-indigo-100">
              <User className="text-indigo-600 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight tracking-tight">FIRO-B 기반 리더십 진단</h2>
            <p className="text-slate-500 mt-2">대인관계지향성을 분석하고 성과 피드백 역량을 정교화합니다.</p>
          </div>
          
          <form onSubmit={handleUserInfoSubmit} className="max-w-md mx-auto space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">성명</label>
                <input 
                  type="text" 
                  required
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">직급</label>
                <input 
                  type="text" 
                  required
                  value={userInfo.rank}
                  onChange={(e) => setUserInfo({...userInfo, rank: e.target.value})}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  placeholder="예: 팀장"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">직책</label>
                <input 
                  type="text" 
                  required
                  value={userInfo.position}
                  onChange={(e) => setUserInfo({...userInfo, position: e.target.value})}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
                  placeholder="예: 전략영업팀장"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
            >
              성향 점수 입력하기 <ChevronRight size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: FIRO-B Score Input */}
      {step === AppStep.SCORE_INPUT && (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">FIRO-B 점수 입력</h2>
            <p className="text-slate-500 mt-2">각 항목의 진단 점수(0~9)를 직접 입력하거나 조절해주세요.</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-xs text-blue-700 leading-relaxed">
              FIRO-B(Fundamental Interpersonal Relations Orientation-Behavior)는 개인의 대인관계 욕구(포함, 통제, 애정)를 표출(Expressed)과 기대(Wanted) 차원에서 분석합니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-indigo-900 text-sm border-b pb-2">포함 욕구 (Inclusion)</h3>
              <ScoreInput 
                label="포함 - 표출 (EI)" 
                description="내가 타인을 소속시키려는 정도" 
                value={scores.inclusionExpressed} 
                onChange={(v) => setScores({...scores, inclusionExpressed: v})}
                color="text-indigo-600"
                max={9}
              />
              <ScoreInput 
                label="포함 - 기대 (WI)" 
                description="내가 소속되고자 원하는 정도" 
                value={scores.inclusionWanted} 
                onChange={(v) => setScores({...scores, inclusionWanted: v})}
                color="text-indigo-400"
                max={9}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-rose-900 text-sm border-b pb-2">통제 욕구 (Control)</h3>
              <ScoreInput 
                label="통제 - 표출 (EC)" 
                description="내가 타인에게 영향력을 주려는 정도" 
                value={scores.controlExpressed} 
                onChange={(v) => setScores({...scores, controlExpressed: v})}
                color="text-rose-600"
                max={9}
              />
              <ScoreInput 
                label="통제 - 기대 (WC)" 
                description="내가 지시나 통제를 수용하려는 정도" 
                value={scores.controlWanted} 
                onChange={(v) => setScores({...scores, controlWanted: v})}
                color="text-rose-400"
                max={9}
              />
            </div>

            <div className="space-y-4 md:col-span-2">
              <h3 className="font-bold text-emerald-900 text-sm border-b pb-2">애정 욕구 (Affection)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScoreInput 
                  label="애정 - 표출 (EA)" 
                  description="내가 타인에게 친밀감을 주는 정도" 
                  value={scores.affectionExpressed} 
                  onChange={(v) => setScores({...scores, affectionExpressed: v})}
                  color="text-emerald-600"
                  max={9}
                />
                <ScoreInput 
                  label="애정 - 기대 (WA)" 
                  description="내가 친밀감을 받기를 원하는 정도" 
                  value={scores.affectionWanted} 
                  onChange={(v) => setScores({...scores, affectionWanted: v})}
                  color="text-emerald-400"
                  max={9}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleScoreSubmit}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:bg-slate-300"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            FIRO-B 성향 리포트 생성
          </button>
        </div>
      )}

      {/* Step 3: Analysis Result */}
      {step === AppStep.ANALYSIS && (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">FIRO-B 분석 리포트</h2>
            <p className="text-slate-500 mt-2">{userInfo.name} 리더님의 대인관계지향성 프로필입니다.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div className="w-full h-[360px] bg-white rounded-3xl border border-slate-100 shadow-inner p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fill="#4f46e5"
                      fillOpacity={0.15}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-6 w-full">
                {chartData.map(d => (
                  <div key={d.subject} className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-medium">{d.subject}</div>
                    <div className="text-sm font-bold text-slate-800">{d.A}점</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 animate-pulse">FIRO-B 데이터 분석 및 리더십 가이드 도출 중...</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm h-full flex flex-col">
                  <div className="bg-indigo-600 px-6 py-3 flex items-center gap-2">
                    <Award className="text-white w-5 h-5" />
                    <span className="text-white font-bold text-sm">전문가 진단 결과</span>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[460px]">
                    <div className="prose prose-indigo prose-sm max-w-none whitespace-pre-line leading-relaxed text-slate-600">
                      {analysis}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isLoading && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-indigo-500/20 rounded-2xl">
                  <MessageCircle size={40} className="text-indigo-400" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-1">성과 면담 시뮬레이션을 시작하세요</h3>
                  <p className="text-slate-300 text-sm opacity-90 leading-relaxed">
                    분석된 욕구 프로필이 실제 성과 피드백 면담에서 어떻게 나타나는지 확인해보세요. <br/>
                    AI 팀원이 리더님의 소통 방식에 반응하며, 종료 후 정밀 평가를 제공합니다.
                  </p>
                </div>
                <button 
                  onClick={handleStartSimulation}
                  className="whitespace-nowrap bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-900/20"
                >
                  시뮬레이션 시작
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Simulation Chat */}
      {step === AppStep.SIMULATION && (
        <div className="flex flex-col h-[700px] border-2 rounded-3xl overflow-hidden border-slate-100 bg-slate-50 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white p-5 border-b flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">성과 피드백 시뮬레이션</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-medium">팀원 '박지민 대리' 대기 중</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleEndSimulation}
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              면담 종료 및 결과 분석
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/50'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                  <div className={`text-[10px] mt-1.5 text-slate-400 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? '리더(나)' : '팀원(박지민 대리)'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-white border-t flex gap-3">
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="면담 내용을 입력하세요 (예: 박대리, 이번 분기 성과에 대해 얘기 나눠봅시다.)"
              className="flex-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !userInput.trim()}
              className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-200 transition-all shadow-lg shadow-indigo-100"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Final Evaluation */}
      {step === AppStep.EVALUATION && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-4 border border-emerald-100">
              <ClipboardCheck className="text-emerald-600 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">전문가 진단 보고서</h2>
            <p className="text-slate-500 mt-2">대화의 구조와 성과 관리 관점에서의 분석 결과입니다.</p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-lg">면담 기록 정밀 분석 중...</h4>
                <p className="text-slate-500 text-sm mt-1">리더님의 대화 패턴을 성과 모델과 대조 중입니다.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-lg font-bold uppercase tracking-wider">Expert Evaluation Result</h3>
                  </div>
                </div>
                <div className="p-8 md:p-12">
                  <div className="prose prose-slate max-w-none prose-strong:text-indigo-600">
                    <div className="whitespace-pre-line leading-relaxed text-slate-700">
                      {evaluation}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => setStep(AppStep.SIMULATION)}
                  className="px-10 py-4 rounded-2xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  면담 다시 진행하기
                </button>
                <button 
                  onClick={resetAll}
                  className="px-10 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                >
                  완전히 처음부터 시작
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
