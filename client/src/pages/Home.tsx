import { useEffect, useState } from "react";
import { Bot, BookOpen, Languages, Lightbulb, MessageCircle, Repeat2, Send, Sparkles, Volume2 } from "lucide-react";

import Recorder from "@/components/Recorder";
import InlineRecorder from "@/components/InlineRecorder";
import { InteractiveSentence, VocabNotebookModal, loadSavedWords } from "@/components/InteractiveSentence";
import { ListeningTrainingView } from "@/components/ListeningTrainingView";
import { trpc } from "@/lib/trpc";

type LevelKey = "beginner" | "intermediate" | "advanced";
type SceneKey = "greetings" | "travel" | "business" | "housing" | "medical" | "banking" | "shopping" | "transit" | "government" | "school";
type DialogueLine = { speaker: string; text: string };
type AIMessage = { id: string; role: "assistant" | "user"; text: string };
type EnglishDraft = { source: string; translation: string };
type SpeechRateKey = "normal" | "slow";
type DailyStats = { date: string; practiceRounds: number; recordings: number; accuracyScores: number[] };

const SPEECH_RATES: Record<SpeechRateKey, { label: string; rate: number }> = {
  normal: { label: "正常", rate: 1 },
  slow: { label: "较慢", rate: 0.7 },
};

const SPEECH_RATE_STORAGE_KEY = "speakwise-speech-rate";
const DAILY_STATS_STORAGE_KEY = "speakwise-daily-stats";

const getLocalDateKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const emptyDailyStats = (): DailyStats => ({ date: getLocalDateKey(), practiceRounds: 0, recordings: 0, accuracyScores: [] });

const loadDailyStats = (): DailyStats => {
  const empty = emptyDailyStats();
  if (typeof window === "undefined") return empty;
  try {
    const stored = window.localStorage.getItem(DAILY_STATS_STORAGE_KEY);
    if (!stored) return empty;
    const parsed = JSON.parse(stored) as Partial<DailyStats>;
    if (parsed.date !== empty.date) return empty;
    return {
      date: empty.date,
      practiceRounds: typeof parsed.practiceRounds === "number" ? Math.max(0, parsed.practiceRounds) : 0,
      recordings: typeof parsed.recordings === "number" ? Math.max(0, parsed.recordings) : 0,
      accuracyScores: Array.isArray(parsed.accuracyScores) ? parsed.accuracyScores.filter((score): score is number => typeof score === "number" && score >= 0 && score <= 100) : [],
    };
  } catch {
    return empty;
  }
};



type Practice = {
  topic: string;
  lesson: string;
  title: string;
  description: string;
  targetSentence: string;
  tip: string;
  dialogue: DialogueLine[];
};

const LEVELS: { key: LevelKey; label: string; englishLabel: string; description: string; progress: number }[] = [
  { key: "beginner", label: "初级", englishLabel: "Beginner", description: "基础表达", progress: 33 },
  { key: "intermediate", label: "中级", englishLabel: "Intermediate", description: "自然交流", progress: 56 },
  { key: "advanced", label: "高级", englishLabel: "Advanced", description: "复杂表达", progress: 82 },
];

const containsChinese = (text: string) => /[\u3400-\u9fff]/.test(text);

const SCENES: { key: SceneKey; label: string; description: string }[] = [
  { key: "greetings", label: "日常问候", description: "打招呼与寒暄" },
  { key: "travel", label: "旅游出行", description: "机场、酒店与问路" },
  { key: "business", label: "商务交流", description: "会议、协作与表达" },
  { key: "housing", label: "租房居住", description: "看房、签租约与报修" },
  { key: "medical", label: "就医看诊", description: "预约、看病与买药" },
  { key: "banking", label: "银行开户", description: "开卡、存取与转账" },
  { key: "shopping", label: "购物用餐", description: "超市、点餐与退换" },
  { key: "transit", label: "交通通勤", description: "公交、地铁与驾照" },
  { key: "government", label: "政务办理", description: "证件、邮局与税务" },
  { key: "school", label: "学校沟通", description: "入学、家校与请假" },
];

const PRACTICE: Record<LevelKey, Record<SceneKey, Practice>> = {
  beginner: {
    greetings: {
      topic: "日常问候",
      lesson: "第 01 课 · 初次见面",
      title: "从一句问候开始。",
      description: "练习简单自然的自我介绍，轻松开启一段英语对话。",
      targetSentence: "Hi, I'm Alex. Nice to meet you.",
      tip: "先清楚地说出 Hi, I'm Alex，再自然地连读 Nice to meet you。",
      dialogue: [
        { speaker: "Alex", text: "Hi, I'm Alex. Nice to meet you." },
        { speaker: "Mia", text: "Nice to meet you too. How are you today?" },
        { speaker: "Alex", text: "I'm good, thank you. How about you?" },
        { speaker: "Mia", text: "I'm doing great as well. Are you new to this neighborhood?" },
        { speaker: "Alex", text: "Yes, I just moved in last weekend." },
        { speaker: "Mia", text: "That's wonderful! Welcome to the community." },
        { speaker: "Alex", text: "Thank you so much. Do you live around here?" },
        { speaker: "Mia", text: "Yes, just down the street. Let me know if you need any recommendations." },
        { speaker: "Alex", text: "I definitely will. Thanks for being so kind." },
        { speaker: "Mia", text: "You're very welcome. Have a wonderful day!" },
      ],
    },
    travel: {
      topic: "旅游出行",
      lesson: "第 02 课 · 机场值机",
      title: "顺利开启一段旅程。",
      description: "从机场最常用的短句开始，练习清楚表达自己的出行需求。",
      targetSentence: "I'd like to check in for my flight.",
      tip: "I'd like to 比 I want to 更礼貌，check in 要连贯地说成一个节奏。",
      dialogue: [
        { speaker: "Traveler", text: "I'd like to check in for my flight, please." },
        { speaker: "Agent", text: "Good morning. May I see your passport and ticket?" },
        { speaker: "Traveler", text: "Sure. Here are my passport and boarding confirmation." },
        { speaker: "Agent", text: "Thank you. Do you have any bags to check?" },
        { speaker: "Traveler", text: "Yes, just this one suitcase." },
        { speaker: "Agent", text: "Please place it on the scale. Would you prefer a window or an aisle seat?" },
        { speaker: "Traveler", text: "An aisle seat, please, if possible." },
        { speaker: "Agent", text: "Certainly. Your seat is 14C. Here is your boarding pass." },
        { speaker: "Traveler", text: "Thank you. Which boarding gate should I go to?" },
        { speaker: "Agent", text: "Gate B22. Boarding begins at 10:15 AM. Have a nice flight!" },
      ],
    },
    business: {
      topic: "商务交流",
      lesson: "第 03 课 · 认识同事",
      title: "自信介绍你的工作。",
      description: "练习在工作场合介绍自己，让第一句英文听起来清晰又友好。",
      targetSentence: "I work on the design team.",
      tip: "work on 后面轻轻连接 design team，句尾保持自然下降的语调。",
      dialogue: [
        { speaker: "Sam", text: "Hi, I'm Sam. I work on the design team." },
        { speaker: "Lee", text: "Nice to meet you, Sam. I'm Lee from marketing." },
        { speaker: "Sam", text: "It's great to meet you too, Lee." },
        { speaker: "Lee", text: "How long have you been with the company?" },
        { speaker: "Sam", text: "I joined about three months ago." },
        { speaker: "Lee", text: "That's exciting! How are you liking it so far?" },
        { speaker: "Sam", text: "Everyone has been extremely supportive and helpful." },
        { speaker: "Lee", text: "We have a wonderful team here. Let's grab coffee later." },
        { speaker: "Sam", text: "I'd love that. Thank you for the warm welcome." },
        { speaker: "Lee", text: "Anytime! See you around lunch." },
      ],
    },
    housing: {
      topic: "租房居住",
      lesson: "第 10 课 · 预约看房",
      title: "在美国顺利租到心仪公寓。",
      description: "练习与房东电话预约看房并确认租金包含项目。",
      targetSentence: "I'm calling about the apartment listing on Main Street.",
      tip: "apartment listing 连读时 apartment 的 t 可以弱化。",
      dialogue: [
        { speaker: "Tenant", text: "Hi, I'm calling about the apartment listing on Main Street." },
        { speaker: "Landlord", text: "Hello! Yes, the two-bedroom unit is still available." },
        { speaker: "Tenant", text: "That would be great. Are you available this Saturday afternoon?" },
        { speaker: "Landlord", text: "Saturday at 2 PM works perfectly for me." },
        { speaker: "Tenant", text: "My budget is around eighteen hundred dollars including utilities." },
        { speaker: "Landlord", text: "Rent is seventeen fifty, and water is included." },
        { speaker: "Tenant", text: "That sounds reasonable. Is street parking available?" },
        { speaker: "Landlord", text: "Yes, we also have assigned garage parking for an extra fee." },
        { speaker: "Tenant", text: "Good to know. I'll see you on Saturday at two then." },
        { speaker: "Landlord", text: "Looking forward to showing you the apartment." },
      ],
    },
    medical: {
      topic: "就医看诊",
      lesson: "第 11 课 · 预约医生",
      title: "在美国诊所顺利预约就医。",
      description: "练习致电诊所预约全科医生并说明病情。",
      targetSentence: "I need to schedule an appointment with a primary care doctor.",
      tip: "primary care doctor 语速要沉稳清晰。",
      dialogue: [
        { speaker: "Patient", text: "Hello, I need to schedule an appointment with a primary care doctor." },
        { speaker: "Receptionist", text: "Certainly. Are you a new patient?" },
        { speaker: "Patient", text: "I'm a new patient, and I have Blue Cross health insurance." },
        { speaker: "Receptionist", text: "We accept that plan. Any specific symptoms today?" },
        { speaker: "Patient", text: "I've had a persistent cough for two days." },
        { speaker: "Receptionist", text: "Dr. Smith has an opening tomorrow morning at 10 AM." },
        { speaker: "Patient", text: "Yes, ten o'clock tomorrow morning works wonderfully." },
        { speaker: "Receptionist", text: "Please bring your insurance card fifteen minutes early." },
        { speaker: "Patient", text: "Will do. Do I need to fill out paperwork?" },
        { speaker: "Receptionist", text: "You can complete intake forms online via our portal." },
      ],
    },
    banking: {
      topic: "银行开户",
      lesson: "第 12 课 · 办理账户",
      title: "在美国银行建立个人财务。",
      description: "练习在银行柜台开设Checking与Savings账户。",
      targetSentence: "I would like to open a checking account and a savings account.",
      tip: "checking account 和 savings account 要分清楚。",
      dialogue: [
        { speaker: "Customer", text: "I would like to open a checking account and a savings account." },
        { speaker: "Banker", text: "Welcome! Do you have two forms of ID?" },
        { speaker: "Customer", text: "Yes, I have my passport and driver's license here." },
        { speaker: "Banker", text: "Perfect. We have a standard account with no monthly fee." },
        { speaker: "Customer", text: "What is the minimum balance required?" },
        { speaker: "Banker", text: "You need to keep a daily average balance of fifteen hundred dollars." },
        { speaker: "Customer", text: "That sounds manageable. Can I get a debit card today?" },
        { speaker: "Banker", text: "I can issue a temporary debit card right now." },
        { speaker: "Customer", text: "Wonderful. I'd also like to deposit my initial opening check." },
        { speaker: "Banker", text: "Just endorse the back of the check." },
      ],
    },
    shopping: {
      topic: "购物用餐",
      lesson: "第 13 课 · 超市购物",
      title: "在美国轻松完成日常购物。",
      description: "练习在超市寻找商品及询问促销活动。",
      targetSentence: "Excuse me, where can I find organic vegetables?",
      tip: "where can I find 用于礼貌问路。",
      dialogue: [
        { speaker: "Shopper", text: "Excuse me, where can I find organic vegetables?" },
        { speaker: "Employee", text: "They are located in aisle four, right next to the dairy section." },
        { speaker: "Shopper", text: "Thank you. Is this brand of olive oil on sale?" },
        { speaker: "Employee", text: "Yes, it's buy one get one free with your rewards card." },
        { speaker: "Shopper", text: "That's a great deal! I'll take two bottles." },
        { speaker: "Employee", text: "Self-checkout registers are open if you have few items." },
        { speaker: "Shopper", text: "Great. Can I pay with contactless phone payment?" },
        { speaker: "Employee", text: "Yes, all our registers support Apple Pay." },
        { speaker: "Shopper", text: "Fantastic. Have a wonderful day." },
        { speaker: "Employee", text: "Thank you! Enjoy your groceries." },
      ],
    },
    transit: {
      topic: "交通通勤",
      lesson: "第 14 课 · 地铁公交",
      title: "熟练使用美国公共交通。",
      description: "练习购买地铁卡及询问换乘路线。",
      targetSentence: "How do I purchase a reloadable transit card here?",
      tip: "reloadable transit card 指可充值公交卡。",
      dialogue: [
        { speaker: "Commuter", text: "How do I purchase a reloadable transit card here?" },
        { speaker: "StationAgent", text: "You can buy a Metro card at this ticket machine." },
        { speaker: "Commuter", text: "Does this card cover both subway and local buses?" },
        { speaker: "StationAgent", text: "Yes, with free transfers within two hours." },
        { speaker: "Commuter", text: "I'd like to load twenty dollars onto a new card." },
        { speaker: "StationAgent", text: "Select 'New Card', insert payment, and collect your card." },
        { speaker: "Commuter", text: "Which platform do I need for downtown bound trains?" },
        { speaker: "StationAgent", text: "Platform B on the lower level." },
        { speaker: "Commuter", text: "Thank you for your clear instructions." },
        { speaker: "StationAgent", text: "Safe travels and smooth commute!" },
      ],
    },
    government: {
      topic: "政务办理",
      lesson: "第 15 课 · 邮局寄件",
      title: "高效处理美国公文事务。",
      description: "练习在邮局寄快递及添加追踪服务。",
      targetSentence: "I'd like to mail this priority package to California, please.",
      tip: "priority package 指优先快递。",
      dialogue: [
        { speaker: "Resident", text: "I'd like to mail this priority package to California, please." },
        { speaker: "Clerk", text: "Sure thing. Let me place it on the scale." },
        { speaker: "Resident", text: "Will it arrive by this Friday?" },
        { speaker: "Clerk", text: "Priority mail takes two to three business days." },
        { speaker: "Resident", text: "Can I add tracking and signature confirmation?" },
        { speaker: "Clerk", text: "Tracking is included, signature confirmation is three dollars extra." },
        { speaker: "Resident", text: "I'll take the signature confirmation as well." },
        { speaker: "Clerk", text: "Total is fourteen fifty. You can tap your card." },
        { speaker: "Resident", text: "Paid. Here is my receipt, thank you." },
        { speaker: "Clerk", text: "Thank you! Have a great day." },
      ],
    },
    school: {
      topic: "学校沟通",
      lesson: "第 16 课 · 家校沟通",
      title: "自信处理教育体系沟通。",
      description: "练习与学校老师沟通孩子学习情况。",
      targetSentence: "I'd like to discuss my child's academic progress this semester.",
      tip: "academic progress 指学业进展。",
      dialogue: [
        { speaker: "Parent", text: "I'd like to discuss my child's academic progress this semester." },
        { speaker: "Teacher", text: "Welcome! Your child is doing wonderfully." },
        { speaker: "Parent", text: "Are there any specific subjects we should focus on?" },
        { speaker: "Teacher", text: "Reading comprehension is strong, math needs practice." },
        { speaker: "Parent", text: "What online resources do you recommend?" },
        { speaker: "Teacher", text: "We use an interactive math platform at school." },
        { speaker: "Parent", text: "Could you email me the login instructions?" },
        { speaker: "Teacher", text: "I'll send those details right after our meeting." },
        { speaker: "Parent", text: "Thank you so much for your support." },
        { speaker: "Teacher", text: "It's my pleasure entirely." },
      ],
    },
  },
  intermediate: {
    greetings: {
      topic: "日常问候",
      lesson: "第 04 课 · 近况寒暄",
      title: "让寒暄听起来更自然。",
      description: "练习用完整句子分享近况，并自然地把话题交给对方。",
      targetSentence: "It's been a while. How have you been?",
      tip: "It's been a while 是熟人之间很自然的问候，while 要读得轻一些。",
      dialogue: [
        { speaker: "Jamie", text: "It's been a while. How have you been?" },
        { speaker: "Taylor", text: "I've been doing well, just very busy with work." },
        { speaker: "Jamie", text: "I know the feeling. We should catch up soon." },
        { speaker: "Taylor", text: "Definitely. Are you free this weekend?" },
        { speaker: "Jamie", text: "Saturday afternoon works perfectly for me." },
        { speaker: "Taylor", text: "Great! Let's meet at that new cafe downtown." },
        { speaker: "Jamie", text: "I've heard great things about their coffee." },
        { speaker: "Taylor", text: "You won't be disappointed. Shall we say around 2 PM?" },
        { speaker: "Jamie", text: "Two o'clock sounds ideal. See you then!" },
        { speaker: "Taylor", text: "Looking forward to it. Have a productive week!" },
      ],
    },
    travel: {
      topic: "旅游出行",
      lesson: "第 05 课 · 酒店入住",
      title: "在旅途中说清楚需求。",
      description: "模拟酒店入住场景，练习礼貌询问和确认重要信息。",
      targetSentence: "I have a reservation under the name Chen.",
      tip: "under the name 后面接姓名，reservation 的重音在第三个音节。",
      dialogue: [
        { speaker: "Guest", text: "I have a reservation under the name Chen." },
        { speaker: "Clerk", text: "Welcome to Grand Hotel. May I see your ID, please?" },
        { speaker: "Guest", text: "Certainly. Here is my passport and credit card." },
        { speaker: "Clerk", text: "Thank you, Mr. Chen. You've booked a deluxe room for four nights." },
        { speaker: "Guest", text: "That's correct. Is breakfast included in the rate?" },
        { speaker: "Clerk", text: "Yes, complimentary buffet breakfast is served from 7 AM to 10 AM." },
        { speaker: "Guest", text: "Wonderful. Could I also request a quiet room on a higher floor?" },
        { speaker: "Clerk", text: "I have assigned room 805 for you, which overlooks the courtyard." },
        { speaker: "Guest", text: "That sounds perfect. Thank you for your help." },
        { speaker: "Clerk", text: "My pleasure. Here is your room key. Enjoy your stay!" },
      ],
    },
    business: {
      topic: "商务交流",
      lesson: "第 06 课 · 会议协作",
      title: "在会议中表达你的想法。",
      description: "练习提出建议、回应同事，并让观点听起来清晰有条理。",
      targetSentence: "I suggest we review the timeline before making a decision.",
      tip: "I suggest 后面直接接完整句子，review the timeline 要保持平稳节奏。",
      dialogue: [
        { speaker: "Morgan", text: "I suggest we review the timeline before making a decision." },
        { speaker: "Casey", text: "That makes sense. Which milestone should we discuss first?" },
        { speaker: "Morgan", text: "Let's start with the product launch and beta testing phase." },
        { speaker: "Casey", text: "The beta test results came in yesterday, and users responded positively." },
        { speaker: "Morgan", text: "That is encouraging news. Did we identify any major bugs?" },
        { speaker: "Casey", text: "Only a few minor UI issues, which the engineering team has already fixed." },
        { speaker: "Morgan", text: "Excellent. Then we can proceed with the marketing campaign as planned." },
        { speaker: "Casey", text: "I'll coordinate with the PR team to draft the announcement." },
        { speaker: "Morgan", text: "Please share the draft with me by Thursday afternoon." },
        { speaker: "Casey", text: "Will do. I'll make sure everything is ready for your review." },
      ],
    },
    housing: {
      topic: "租房居住",
      lesson: "第 10 课 · 预约看房",
      title: "在美国顺利租到心仪公寓。",
      description: "练习与房东电话预约看房并确认租金包含项目。",
      targetSentence: "I'm calling about the apartment listing on Main Street.",
      tip: "apartment listing 连读时 apartment 的 t 可以弱化。",
      dialogue: [
        { speaker: "Tenant", text: "Hi, I'm calling about the apartment listing on Main Street." },
        { speaker: "Landlord", text: "Hello! Yes, the two-bedroom unit is still available." },
        { speaker: "Tenant", text: "That would be great. Are you available this Saturday afternoon?" },
        { speaker: "Landlord", text: "Saturday at 2 PM works perfectly for me." },
        { speaker: "Tenant", text: "My budget is around eighteen hundred dollars including utilities." },
        { speaker: "Landlord", text: "Rent is seventeen fifty, and water is included." },
        { speaker: "Tenant", text: "That sounds reasonable. Is street parking available?" },
        { speaker: "Landlord", text: "Yes, we also have assigned garage parking for an extra fee." },
        { speaker: "Tenant", text: "Good to know. I'll see you on Saturday at two then." },
        { speaker: "Landlord", text: "Looking forward to showing you the apartment." },
      ],
    },
    medical: {
      topic: "就医看诊",
      lesson: "第 11 课 · 预约医生",
      title: "在美国诊所顺利预约就医。",
      description: "练习致电诊所预约全科医生并说明病情。",
      targetSentence: "I need to schedule an appointment with a primary care doctor.",
      tip: "primary care doctor 语速要沉稳清晰。",
      dialogue: [
        { speaker: "Patient", text: "Hello, I need to schedule an appointment with a primary care doctor." },
        { speaker: "Receptionist", text: "Certainly. Are you a new patient?" },
        { speaker: "Patient", text: "I'm a new patient, and I have Blue Cross health insurance." },
        { speaker: "Receptionist", text: "We accept that plan. Any specific symptoms today?" },
        { speaker: "Patient", text: "I've had a persistent cough for two days." },
        { speaker: "Receptionist", text: "Dr. Smith has an opening tomorrow morning at 10 AM." },
        { speaker: "Patient", text: "Yes, ten o'clock tomorrow morning works wonderfully." },
        { speaker: "Receptionist", text: "Please bring your insurance card fifteen minutes early." },
        { speaker: "Patient", text: "Will do. Do I need to fill out paperwork?" },
        { speaker: "Receptionist", text: "You can complete intake forms online via our portal." },
      ],
    },
    banking: {
      topic: "银行开户",
      lesson: "第 12 课 · 办理账户",
      title: "在美国银行建立个人财务。",
      description: "练习在银行柜台开设Checking与Savings账户。",
      targetSentence: "I would like to open a checking account and a savings account.",
      tip: "checking account 和 savings account 要分清楚。",
      dialogue: [
        { speaker: "Customer", text: "I would like to open a checking account and a savings account." },
        { speaker: "Banker", text: "Welcome! Do you have two forms of ID?" },
        { speaker: "Customer", text: "Yes, I have my passport and driver's license here." },
        { speaker: "Banker", text: "Perfect. We have a standard account with no monthly fee." },
        { speaker: "Customer", text: "What is the minimum balance required?" },
        { speaker: "Banker", text: "You need to keep a daily average balance of fifteen hundred dollars." },
        { speaker: "Customer", text: "That sounds manageable. Can I get a debit card today?" },
        { speaker: "Banker", text: "I can issue a temporary debit card right now." },
        { speaker: "Customer", text: "Wonderful. I'd also like to deposit my initial opening check." },
        { speaker: "Banker", text: "Just endorse the back of the check." },
      ],
    },
    shopping: {
      topic: "购物用餐",
      lesson: "第 13 课 · 超市购物",
      title: "在美国轻松完成日常购物。",
      description: "练习在超市寻找商品及询问促销活动。",
      targetSentence: "Excuse me, where can I find organic vegetables?",
      tip: "where can I find 用于礼貌问路。",
      dialogue: [
        { speaker: "Shopper", text: "Excuse me, where can I find organic vegetables?" },
        { speaker: "Employee", text: "They are located in aisle four, right next to the dairy section." },
        { speaker: "Shopper", text: "Thank you. Is this brand of olive oil on sale?" },
        { speaker: "Employee", text: "Yes, it's buy one get one free with your rewards card." },
        { speaker: "Shopper", text: "That's a great deal! I'll take two bottles." },
        { speaker: "Employee", text: "Self-checkout registers are open if you have few items." },
        { speaker: "Shopper", text: "Great. Can I pay with contactless phone payment?" },
        { speaker: "Employee", text: "Yes, all our registers support Apple Pay." },
        { speaker: "Shopper", text: "Fantastic. Have a wonderful day." },
        { speaker: "Employee", text: "Thank you! Enjoy your groceries." },
      ],
    },
    transit: {
      topic: "交通通勤",
      lesson: "第 14 课 · 地铁公交",
      title: "熟练使用美国公共交通。",
      description: "练习购买地铁卡及询问换乘路线。",
      targetSentence: "How do I purchase a reloadable transit card here?",
      tip: "reloadable transit card 指可充值公交卡。",
      dialogue: [
        { speaker: "Commuter", text: "How do I purchase a reloadable transit card here?" },
        { speaker: "StationAgent", text: "You can buy a Metro card at this ticket machine." },
        { speaker: "Commuter", text: "Does this card cover both subway and local buses?" },
        { speaker: "StationAgent", text: "Yes, with free transfers within two hours." },
        { speaker: "Commuter", text: "I'd like to load twenty dollars onto a new card." },
        { speaker: "StationAgent", text: "Select 'New Card', insert payment, and collect your card." },
        { speaker: "Commuter", text: "Which platform do I need for downtown bound trains?" },
        { speaker: "StationAgent", text: "Platform B on the lower level." },
        { speaker: "Commuter", text: "Thank you for your clear instructions." },
        { speaker: "StationAgent", text: "Safe travels and smooth commute!" },
      ],
    },
    government: {
      topic: "政务办理",
      lesson: "第 15 课 · 邮局寄件",
      title: "高效处理美国公文事务。",
      description: "练习在邮局寄快递及添加追踪服务。",
      targetSentence: "I'd like to mail this priority package to California, please.",
      tip: "priority package 指优先快递。",
      dialogue: [
        { speaker: "Resident", text: "I'd like to mail this priority package to California, please." },
        { speaker: "Clerk", text: "Sure thing. Let me place it on the scale." },
        { speaker: "Resident", text: "Will it arrive by this Friday?" },
        { speaker: "Clerk", text: "Priority mail takes two to three business days." },
        { speaker: "Resident", text: "Can I add tracking and signature confirmation?" },
        { speaker: "Clerk", text: "Tracking is included, signature confirmation is three dollars extra." },
        { speaker: "Resident", text: "I'll take the signature confirmation as well." },
        { speaker: "Clerk", text: "Total is fourteen fifty. You can tap your card." },
        { speaker: "Resident", text: "Paid. Here is my receipt, thank you." },
        { speaker: "Clerk", text: "Thank you! Have a great day." },
      ],
    },
    school: {
      topic: "学校沟通",
      lesson: "第 16 课 · 家校沟通",
      title: "自信处理教育体系沟通。",
      description: "练习与学校老师沟通孩子学习情况。",
      targetSentence: "I'd like to discuss my child's academic progress this semester.",
      tip: "academic progress 指学业进展。",
      dialogue: [
        { speaker: "Parent", text: "I'd like to discuss my child's academic progress this semester." },
        { speaker: "Teacher", text: "Welcome! Your child is doing wonderfully." },
        { speaker: "Parent", text: "Are there any specific subjects we should focus on?" },
        { speaker: "Teacher", text: "Reading comprehension is strong, math needs practice." },
        { speaker: "Parent", text: "What online resources do you recommend?" },
        { speaker: "Teacher", text: "We use an interactive math platform at school." },
        { speaker: "Parent", text: "Could you email me the login instructions?" },
        { speaker: "Teacher", text: "I'll send those details right after our meeting." },
        { speaker: "Parent", text: "Thank you so much for your support." },
        { speaker: "Teacher", text: "It's my pleasure entirely." },
      ],
    },
  },
  advanced: {
    greetings: {
      topic: "日常问候",
      lesson: "第 07 课 · 深入交谈",
      title: "把问候延伸成真正的交流。",
      description: "练习从简单寒暄自然过渡到经历、观点和下一步计划。",
      targetSentence: "What have you been enjoying lately?",
      tip: "What have you been enjoying 是开放式提问，enjoying 的结尾不要吞音。",
      dialogue: [
        { speaker: "Jordan", text: "What have you been enjoying lately?" },
        { speaker: "Riley", text: "I've been taking a photography class after work." },
        { speaker: "Jordan", text: "That sounds fascinating. What kind of subjects do you focus on?" },
        { speaker: "Riley", text: "Mostly street photography and architecture in the city." },
        { speaker: "Jordan", text: "Capturing urban life requires great timing and patience." },
        { speaker: "Riley", text: "It really does. You notice details you usually walk past." },
        { speaker: "Jordan", text: "Have you considered exhibiting any of your work?" },
        { speaker: "Riley", text: "Maybe in a local gallery once I build a stronger portfolio." },
        { speaker: "Jordan", text: "I'm sure people would love your perspective." },
        { speaker: "Riley", text: "Thank you for the encouragement. I appreciate it!" },
      ],
    },
    travel: {
      topic: "旅游出行",
      lesson: "第 08 课 · 处理突发情况",
      title: "从容应对旅途变化。",
      description: "模拟航班延误等突发情况，练习解释问题并礼貌地寻求帮助。",
      targetSentence: "Could you help me find an alternative connection?",
      tip: "alternative connection 是解决行程问题的关键表达，两个词都要说清楚。",
      dialogue: [
        { speaker: "Passenger", text: "Excuse me, I just noticed my connecting flight has been canceled." },
        { speaker: "Agent", text: "I'm very sorry to hear that. May I see your ticket and passport?" },
        { speaker: "Passenger", text: "Here they are. Is there another flight to Chicago tonight?" },
        { speaker: "Agent", text: "Let me check the system. Yes, there is a flight departing at 8:30 PM." },
        { speaker: "Passenger", text: "Could you help me book a seat on that alternative connection?" },
        { speaker: "Agent", text: "Of course. I can transfer your ticket at no additional charge." },
        { speaker: "Passenger", text: "That is a huge relief. What about my checked luggage?" },
        { speaker: "Agent", text: "Your baggage will automatically be transferred to the new flight." },
        { speaker: "Passenger", text: "Thank you so much for your prompt and helpful assistance." },
        { speaker: "Agent", text: "You're very welcome. Here is your updated boarding pass. Have a safe trip!" },
      ],
    },
    business: {
      topic: "商务交流",
      lesson: "第 09 课 · 战略复盘",
      title: "在项目复盘中发表专业见解。",
      description: "练习讨论项目指标、资源分配和团队协同。",
      targetSentence: "Let's review the key performance indicators for this quarter.",
      tip: "key performance indicators 可以简称为 KPI，语调要在句尾平稳收住。",
      dialogue: [
        { speaker: "Director", text: "Let's review the key performance indicators for this quarter." },
        { speaker: "Manager", text: "Revenue grew by 18%, exceeding our initial projections." },
        { speaker: "Director", text: "That is an impressive result given market fluctuations." },
        { speaker: "Manager", text: "Our customer retention rate also improved significantly." },
        { speaker: "Director", text: "What contributed most to that retention growth?" },
        { speaker: "Manager", text: "Implementing automated onboarding and proactive customer support." },
        { speaker: "Director", text: "Excellent strategy. We should allocate more resources to that initiative." },
        { speaker: "Manager", text: "I will prepare a detailed budget proposal by Friday." },
        { speaker: "Director", text: "Please ensure you consult with the finance department first." },
        { speaker: "Manager", text: "Understood. I will schedule a joint meeting tomorrow morning." },
      ],
    },
    housing: {
      topic: "租房居住",
      lesson: "第 10 课 · 预约看房",
      title: "在美国顺利租到心仪公寓。",
      description: "练习与房东或中介电话沟通看房时间、租金及押金条款。",
      targetSentence: "I'm calling about the apartment listing on Main Street.",
      tip: "listing 指房源信息，apartment listing 要连贯清晰。",
      dialogue: [
        { speaker: "Tenant", text: "Hi, I'm calling about the apartment listing on Main Street." },
        { speaker: "Landlord", text: "Hello! Yes, the two-bedroom unit is still available. Would you like to schedule a viewing?" },
        { speaker: "Tenant", text: "That would be great. Are you available this Saturday afternoon?" },
        { speaker: "Landlord", text: "Saturday at 2 PM works perfectly for me. What is your monthly budget?" },
        { speaker: "Tenant", text: "My budget is around eighteen hundred dollars including utilities." },
        { speaker: "Landlord", text: "Rent is seventeen fifty, and water is included. Electricity is separate." },
        { speaker: "Tenant", text: "That sounds reasonable. Is street parking available?" },
        { speaker: "Landlord", text: "Yes, and we also have assigned garage parking for an extra fee." },
        { speaker: "Tenant", text: "Good to know. I'll see you on Saturday at two then." },
        { speaker: "Landlord", text: "Looking forward to showing you the apartment. Have a nice day!" },
      ],
    },
    medical: {
      topic: "就医看诊",
      lesson: "第 11 课 · 预约医生",
      title: "在美国诊所顺利就医。",
      description: "练习致电诊所预约医生、说明病情症状及确认保险覆盖。",
      targetSentence: "I need to schedule an appointment with a primary care doctor.",
      tip: "primary care doctor 指全科医生，预约时语速要沉稳。",
      dialogue: [
        { speaker: "Patient", text: "Hello, I need to schedule an appointment with a primary care doctor." },
        { speaker: "Receptionist", text: "Certainly. Are you a new patient, and what insurance do you carry?" },
        { speaker: "Patient", text: "I'm a new patient, and I have Blue Cross health insurance." },
        { speaker: "Receptionist", text: "We accept that plan. Are you experiencing any specific symptoms today?" },
        { speaker: "Patient", text: "I've had a persistent cough and mild fever for two days." },
        { speaker: "Receptionist", text: "Dr. Smith has an opening tomorrow morning at 10 AM. Does that work?" },
        { speaker: "Patient", text: "Yes, ten o'clock tomorrow morning works wonderfully." },
        { speaker: "Receptionist", text: "Please bring your insurance card and photo ID fifteen minutes early." },
        { speaker: "Patient", text: "Will do. Do I need to fill out any paperwork in advance?" },
        { speaker: "Receptionist", text: "You can complete the intake forms online via our patient portal." },
      ],
    },
    banking: {
      topic: "银行开户",
      lesson: "第 12 课 · 办理支票账户",
      title: "在美国银行建立个人财务。",
      description: "练习在银行柜台开设Checking与Savings账户并办理借记卡。",
      targetSentence: "I would like to open a checking account and a savings account.",
      tip: "checking account 指支票账户，savings account 指储蓄账户。",
      dialogue: [
        { speaker: "Customer", text: "Hello, I would like to open a checking account and a savings account." },
        { speaker: "Banker", text: "Welcome! I'd be happy to help you with that. Do you have two forms of ID?" },
        { speaker: "Customer", text: "Yes, I have my passport and my driver's license here." },
        { speaker: "Banker", text: "Perfect. We have a standard account with no monthly fee if you maintain a minimum balance." },
        { speaker: "Customer", text: "What is the minimum balance required to waive the fee?" },
        { speaker: "Banker", text: "You need to keep a daily average balance of fifteen hundred dollars." },
        { speaker: "Customer", text: "That sounds manageable. Can I get a debit card today?" },
        { speaker: "Banker", text: "I can issue a temporary debit card right now, and the permanent one will arrive by mail." },
        { speaker: "Customer", text: "Wonderful. I'd also like to deposit my initial opening check." },
        { speaker: "Banker", text: "Just endorse the back of the check, and I'll process it immediately." },
      ],
    },
    shopping: {
      topic: "购物用餐",
      lesson: "第 13 课 · 超市与餐厅",
      title: "在美国轻松完成日常购物与点餐。",
      description: "练习在超市结账、询问商品位置以及在餐厅点餐。",
      targetSentence: "Excuse me, where can I find organic vegetables?",
      tip: "organic vegetables 指有机蔬菜，where can I find 用于礼貌问路。",
      dialogue: [
        { speaker: "Shopper", text: "Excuse me, where can I find organic vegetables in this aisle?" },
        { speaker: "Employee", text: "They are located in aisle four, right next to the dairy section." },
        { speaker: "Shopper", text: "Thank you so much. Also, is this brand of olive oil on sale today?" },
        { speaker: "Employee", text: "Yes, it's buy one get one free with your store rewards card." },
        { speaker: "Shopper", text: "That's a great deal! I'll take two bottles then." },
        { speaker: "Employee", text: "Self-checkout registers are open if you only have a few items." },
        { speaker: "Shopper", text: "Great, I'll head over there. Can I pay with contactless phone payment?" },
        { speaker: "Employee", text: "Yes, all our registers support Apple Pay and tap-to-pay cards." },
        { speaker: "Shopper", text: "Fantastic. Have a wonderful rest of your day." },
        { speaker: "Employee", text: "Thank you! Enjoy your groceries." },
      ],
    },
    transit: {
      topic: "交通通勤",
      lesson: "第 14 课 · 地铁与公交",
      title: "熟练使用美国公共交通与驾照事务。",
      description: "练习购买地铁卡、询问换乘路线及办理车务。",
      targetSentence: "How do I purchase a reloadable transit card here?",
      tip: "reloadable transit card 指可充值公交卡。",
      dialogue: [
        { speaker: "Commuter", text: "Hello, how do I purchase a reloadable transit card here?" },
        { speaker: "StationAgent", text: "You can buy a Metro card at this ticket machine using cash or card." },
        { speaker: "Commuter", text: "Does this card cover both the subway and local buses?" },
        { speaker: "StationAgent", text: "Yes, it gives you free transfers between buses and subways within two hours." },
        { speaker: "Commuter", text: "That's very convenient. I'd like to load twenty dollars onto a new card." },
        { speaker: "StationAgent", text: "Just select 'New Card', insert your payment, and collect your card from below." },
        { speaker: "Commuter", text: "Got it. Which platform do I need for downtown bound trains?" },
        { speaker: "StationAgent", text: "Platform B on the lower level. Trains arrive every six minutes." },
        { speaker: "Commuter", text: "Thank you for your clear instructions." },
        { speaker: "StationAgent", text: "Safe travels and have a smooth commute!" },
      ],
    },
    government: {
      topic: "政务办理",
      lesson: "第 15 课 · 邮局与证件",
      title: "高效处理美国各类公文事务。",
      description: "练习在邮局寄包裹、信件及咨询行政证件办理。",
      targetSentence: "I'd like to mail this priority package to California, please.",
      tip: "priority package 指优先快递，to California 指发往加州。",
      dialogue: [
        { speaker: "Resident", text: "Hello, I'd like to mail this priority package to California, please." },
        { speaker: "Clerk", text: "Sure thing. Let me place it on the scale to check the postage." },
        { speaker: "Resident", text: "Will it arrive by this Friday? It contains important documents." },
        { speaker: "Clerk", text: "Priority mail typically takes two to three business days, so it should arrive on Thursday." },
        { speaker: "Resident", text: "That's wonderful. Can I also add tracking and signature confirmation?" },
        { speaker: "Clerk", text: "Of course. Tracking is included, and signature confirmation is three dollars extra." },
        { speaker: "Resident", text: "I'll take the signature confirmation as well for extra security." },
        { speaker: "Clerk", text: "Total comes to fourteen fifty. You can tap your card on the keypad." },
        { speaker: "Resident", text: "Paid. Here is my receipt, thank you for your help." },
        { speaker: "Clerk", text: "Thank you! Here is your tracking label. Have a great day." },
      ],
    },
    school: {
      topic: "学校沟通",
      lesson: "第 16 课 · 家校与入学",
      title: "自信处理美国教育体系中的沟通。",
      description: "练习与学校老师沟通孩子学习情况、参加家长会及入学注册。",
      targetSentence: "I'd like to discuss my child's academic progress this semester.",
      tip: "academic progress 指学业进展，semester 指学期。",
      dialogue: [
        { speaker: "Parent", text: "Hello, I'd like to discuss my child's academic progress this semester." },
        { speaker: "Teacher", text: "Welcome! I'm glad you scheduled this conference. Your child is doing wonderfully." },
        { speaker: "Parent", text: "Thank you. Are there any specific subjects we should focus on improving?" },
        { speaker: "Teacher", text: "Reading comprehension is strong, but math problem-solving could use a little extra practice." },
        { speaker: "Parent", text: "I appreciate that feedback. What online resources do you recommend?" },
        { speaker: "Teacher", text: "We use an interactive math platform at school that students can access at home." },
        { speaker: "Parent", text: "Could you email me the login instructions and parent passcode?" },
        { speaker: "Teacher", text: "I'll send those details right after our meeting today." },
        { speaker: "Parent", text: "Thank you so much for your dedication and support." },
        { speaker: "Teacher", text: "It's my pleasure. Partnering with parents makes all the difference." },
      ],
    },
  },
};

export default function Home() {
  const [levelKey, setLevelKey] = useState<LevelKey>("beginner");
  const [sceneKey, setSceneKey] = useState<SceneKey>("greetings");
  const [lastTake, setLastTake] = useState<string | null>(null);
  const [translatedLines, setTranslatedLines] = useState<Record<string, string>>({});
  const [translatingLine, setTranslatingLine] = useState<string | null>(null);
  const [speakingLine, setSpeakingLine] = useState<string | null>(null);
  const [speechRateKey, setSpeechRateKey] = useState<SpeechRateKey>(() => {
    if (typeof window === "undefined") return "normal";
    const stored = window.localStorage.getItem(SPEECH_RATE_STORAGE_KEY);
    return stored === "slow" ? "slow" : "normal";
  });
  const [lineActionError, setLineActionError] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    { id: "beginner-greetings-starter", role: "assistant", text: PRACTICE.beginner.greetings.dialogue[0].text },
  ]);
  const [aiDialogueError, setAiDialogueError] = useState<string | null>(null);
  const [englishDraft, setEnglishDraft] = useState<EnglishDraft | null>(null);
  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => loadDailyStats());
  const [translatedSuggestions, setTranslatedSuggestions] = useState<Record<string, string>>({});
  const [translatingSuggestion, setTranslatingSuggestion] = useState<string | null>(null);
  const [suggestionActionError, setSuggestionActionError] = useState<{ key: string; type: "speech" | "translation" } | null>(null);
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"practice" | "listening">("practice");
  const [savedVocabCount, setSavedVocabCount] = useState(() => loadSavedWords().length);
  const [sidebarVocabList, setSidebarVocabList] = useState(() => loadSavedWords());
  const [sidebarSentenceTranslations, setSidebarSentenceTranslations] = useState<Record<string, string>>({});
  const [sidebarTranslatingKey, setSidebarTranslatingKey] = useState<string | null>(null);
  const [sidebarSpeakingKey, setSidebarSpeakingKey] = useState<string | null>(null);

  const refreshVocabData = () => {
    const fresh = loadSavedWords();
    setSavedVocabCount(fresh.length);
    setSidebarVocabList(fresh);
  };

  const playSidebarWord = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = SPEECH_RATES[speechRateKey].rate;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSidebarSentence = (key: string, text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSidebarSpeakingKey(key);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATES[speechRateKey].rate;
      utterance.lang = "en-US";
      utterance.onend = () => setSidebarSpeakingKey(null);
      utterance.onerror = () => setSidebarSpeakingKey(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const translateSidebarSentence = async (key: string, text: string) => {
    if (sidebarSentenceTranslations[key]) {
      setSidebarSentenceTranslations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }
    setSidebarTranslatingKey(key);
    try {
      const result = await translateMutation.mutateAsync({ text });
      setSidebarSentenceTranslations((current) => ({ ...current, [key]: result.translation }));
    } catch {
      // ignore
    } finally {
      setSidebarTranslatingKey(null);
    }
  };
  const level = LEVELS.find((item) => item.key === levelKey) ?? LEVELS[0];
  const translateMutation = trpc.translation.toChinese.useMutation();
  const englishTranslationMutation = trpc.translation.toEnglish.useMutation();
  const dialogueMutation = trpc.dialogue.reply.useMutation();
  const suggestionsMutation = trpc.dialogue.suggestions.useMutation();
  const practice = PRACTICE[levelKey][sceneKey];
  const latestAIMessage = [...aiMessages].reverse().find((message) => message.role === "assistant");
  const latestAIMessageKey = latestAIMessage ? `ai-${latestAIMessage.id}` : null;

  useEffect(() => {
    setAiMessages([
      { id: `${levelKey}-${sceneKey}-starter`, role: "assistant", text: practice.dialogue[0].text },
    ]);
    setAiInput("");
    setEnglishDraft(null);
    setReplySuggestions([]);
    setTranslatedSuggestions({});
    setTranslatingSuggestion(null);
    setSuggestionActionError(null);
    setAiDialogueError(null);
  }, [levelKey, sceneKey, practice.dialogue]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DAILY_STATS_STORAGE_KEY, JSON.stringify(dailyStats));
    }
  }, [dailyStats]);

  const updateDailyStats = (update: (current: DailyStats) => DailyStats) => {
    setDailyStats((current) => update(current));
  };

  const averageAccuracy = dailyStats.accuracyScores.length > 0
    ? Math.round(dailyStats.accuracyScores.reduce((total, score) => total + score, 0) / dailyStats.accuracyScores.length)
    : null;

  const resetSentenceTools = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setTranslatedLines({});
    setTranslatingLine(null);
    setSpeakingLine(null);
    setLineActionError(null);
    setTranslatedSuggestions({});
    setTranslatingSuggestion(null);
    setSuggestionActionError(null);
  };

  const selectLevel = (nextLevel: LevelKey) => {
    if (nextLevel === levelKey) return;
    setLevelKey(nextLevel);
    setLastTake(null);
    resetSentenceTools();
  };

  const selectScene = (nextScene: SceneKey) => {
    if (nextScene === sceneKey) return;
    setSceneKey(nextScene);
    setLastTake(null);
    resetSentenceTools();
  };

  const selectSpeechRate = (nextRate: SpeechRateKey) => {
    if (nextRate === speechRateKey) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingLine(null);
    setSpeechRateKey(nextRate);
    window.localStorage.setItem(SPEECH_RATE_STORAGE_KEY, nextRate);
  };

  const listenToExample = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(practice.targetSentence);
    utterance.lang = "en-US";
    utterance.rate = SPEECH_RATES[speechRateKey].rate;
    window.speechSynthesis.speak(utterance);
  };

  const speakLine = (lineKey: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setLineActionError(lineKey);
      return;
    }

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    setSpeakingLine(lineKey);
    setLineActionError(null);

    const startSpeaking = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const englishVoice = synthesis.getVoices().find((voice) => /^en(-|_)/i.test(voice.lang));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = englishVoice?.lang ?? "en-US";
      utterance.rate = SPEECH_RATES[speechRateKey].rate;
      utterance.onend = () => setSpeakingLine(null);
      utterance.onerror = (event) => {
        setSpeakingLine(null);
        if (event.error !== "canceled" && event.error !== "interrupted") {
          setLineActionError(lineKey);
        }
      };
      synthesis.speak(utterance);
    };

    if (synthesis.getVoices().length === 0) {
      let started = false;
      const onVoicesChanged = () => {
        if (started) return;
        started = true;
        synthesis.removeEventListener("voiceschanged", onVoicesChanged);
        startSpeaking();
      };
      synthesis.addEventListener("voiceschanged", onVoicesChanged, { once: true });
      window.setTimeout(() => {
        if (started) return;
        started = true;
        synthesis.removeEventListener("voiceschanged", onVoicesChanged);
        startSpeaking();
      }, 350);
      return;
    }

    startSpeaking();
  };

  const submitAIMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || dialogueMutation.isPending || englishTranslationMutation.isPending || suggestionsMutation.isPending) return;

    if (containsChinese(text)) {
      setAiDialogueError(null);
      setEnglishDraft(null);
      try {
        const result = await englishTranslationMutation.mutateAsync({ text });
        setEnglishDraft({ source: text, translation: result.translation });
        setAiInput(result.translation);
      } catch {
        setAiDialogueError("英文表达生成失败，请稍后重试。");
      }
      return;
    }

    setEnglishDraft(null);
    const userMessage: AIMessage = {
      id: `${levelKey}-${sceneKey}-user-${Date.now()}`,
      role: "user",
      text,
    };
    const history = aiMessages.slice(-8).map(({ role, text: messageText }) => ({ role, text: messageText }));
    setAiMessages((current) => [...current, userMessage]);
    updateDailyStats((current) => ({ ...current, practiceRounds: current.practiceRounds + 1 }));
    setAiInput("");
    setAiDialogueError(null);

    try {
      const result = await dialogueMutation.mutateAsync({
        level: levelKey,
        scene: sceneKey,
        history,
        userMessage: text,
      });
      setAiMessages((current) => [
        ...current,
        { id: `${levelKey}-${sceneKey}-assistant-${Date.now()}`, role: "assistant", text: result.reply },
      ]);
    } catch {
      setAiDialogueError("AI 暂时没有回应，请检查网络后再试一次。");
    }
  };

  const replayLatestAIMessage = () => {
    if (!latestAIMessage || !latestAIMessageKey) return;
    speakLine(latestAIMessageKey, latestAIMessage.text);
  };

  const requestReplySuggestions = async () => {
    if (!latestAIMessage || dialogueMutation.isPending || englishTranslationMutation.isPending || suggestionsMutation.isPending) return;
    setReplySuggestions([]);
    setTranslatedSuggestions({});
    setTranslatingSuggestion(null);
    setSuggestionActionError(null);
    setAiDialogueError(null);
    try {
      const history = aiMessages.slice(-8).map(({ role, text: messageText }) => ({ role, text: messageText }));
      const result = await suggestionsMutation.mutateAsync({
        level: levelKey,
        scene: sceneKey,
        history,
        aiMessage: latestAIMessage.text,
      });
      setReplySuggestions(result.suggestions);
    } catch {
      setAiDialogueError("英文回复提示生成失败，请稍后重试。");
    }
  };

  const translateSuggestion = async (suggestionKey: string, text: string) => {
    if (translatedSuggestions[suggestionKey]) {
      setTranslatedSuggestions((current) => {
        const next = { ...current };
        delete next[suggestionKey];
        return next;
      });
      setSuggestionActionError(null);
      return;
    }

    setTranslatingSuggestion(suggestionKey);
    setSuggestionActionError(null);
    try {
      const result = await translateMutation.mutateAsync({ text });
      setTranslatedSuggestions((current) => ({ ...current, [suggestionKey]: result.translation }));
    } catch {
      setSuggestionActionError({ key: suggestionKey, type: "translation" });
    } finally {
      setTranslatingSuggestion(null);
    }
  };

  const useReplySuggestion = (suggestion: string) => {
    setAiInput(suggestion);
    setEnglishDraft(null);
    setAiDialogueError(null);
    window.setTimeout(() => document.getElementById("ai-dialogue-input")?.focus(), 0);
  };

  const handleAIInputChange = (value: string) => {
    setAiInput(value);
    if (englishDraft && value !== englishDraft.translation) setEnglishDraft(null);
    if (aiDialogueError) setAiDialogueError(null);
  };

  const useEnglishDraft = () => {
    if (!englishDraft) return;
    setAiInput(englishDraft.translation);
    setAiDialogueError(null);
    window.setTimeout(() => document.getElementById("ai-dialogue-input")?.focus(), 0);
  };

  const translateLine = async (lineKey: string, text: string) => {
    if (translatedLines[lineKey]) {
      setTranslatedLines((current) => {
        const next = { ...current };
        delete next[lineKey];
        return next;
      });
      return;
    }

    setTranslatingLine(lineKey);
    setLineActionError(null);
    try {
      const result = await translateMutation.mutateAsync({ text });
      setTranslatedLines((current) => ({ ...current, [lineKey]: result.translation }));
    } catch {
      setLineActionError(lineKey);
    } finally {
      setTranslatingLine(null);
    }
  };

  return (
    <div className="learning-shell">
      <header className="learning-header">
        <a className="learning-brand" href="/" aria-label="首页">
          <span className="learning-brand__mark" aria-hidden="true">S</span>
          <span>英语口语</span>
        </a>
        <nav className="learning-nav" aria-label="主导航">
          <button
            type="button"
            onClick={() => setActiveTab("practice")}
            className={`learning-nav__link bg-transparent border-0 cursor-pointer ${activeTab === "practice" ? "learning-nav__link--active" : ""}`}
          >
            口语练习
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("listening")}
            className={`learning-nav__link bg-transparent border-0 cursor-pointer ${activeTab === "listening" ? "learning-nav__link--active" : ""}`}
          >
            听力训练
          </button>
          <a className="learning-nav__link" href="#progress">我的进度</a>
          <button
            type="button"
            onClick={() => setIsVocabModalOpen(true)}
            className="learning-nav__link text-left bg-transparent border-0 cursor-pointer flex items-center gap-1.5"
          >
            生词本 <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded-full">{savedVocabCount}</span>
          </button>
        </nav>
        <div className="learning-header__level">
          <span className="learning-header__dot" />
          <span>英语 · {level.label}</span>
        </div>
      </header>

      <main className="learning-main" id="practice">
        {activeTab === "listening" ? (
          <ListeningTrainingView speechRate={SPEECH_RATES[speechRateKey].rate} />
        ) : (
          <>
            <div className="learning-breadcrumb">
              <span>英语口语</span>
              <span>/</span>
              <strong>{practice.topic}</strong>
            </div>

        <section className="practice-filters" aria-label="选择练习难度和场景">
          <div className="practice-filter-group">
            <span className="practice-filter-label">难度级别</span>
            <div className="practice-filter-options" role="tablist" aria-label="选择难度级别">
              {LEVELS.map((item) => (
                <button
                  className={`practice-filter-button ${levelKey === item.key ? "practice-filter-button--active" : ""}`}
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={levelKey === item.key}
                  onClick={() => selectLevel(item.key)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.englishLabel}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="practice-filter-group">
            <span className="practice-filter-label">对话场景</span>
            <div className="practice-filter-options" role="tablist" aria-label="选择对话场景">
              {SCENES.map((item) => (
                <button
                  className={`practice-filter-button practice-filter-button--scene ${sceneKey === item.key ? "practice-filter-button--active" : ""}`}
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={sceneKey === item.key}
                  onClick={() => selectScene(item.key)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="lesson-layout">
          <div className="lesson-content">
            <div className="lesson-heading">
              <div>
                <p className="lesson-kicker"><BookOpen size={15} /> {practice.lesson}</p>
                <h1>{practice.title}</h1>
                <p className="lesson-description">{practice.description}</p>
              </div>
              <span className="lesson-progress">{level.label} · {practice.topic}</span>
            </div>

            <div className="sentence-card">
              <div className="sentence-card__label">本课目标句</div>
              <p className="sentence-card__text">“<InteractiveSentence text={practice.targetSentence} speechRate={SPEECH_RATES[speechRateKey].rate} onVocabChange={() => setSavedVocabCount(loadSavedWords().length)} />”</p>
              <div className="sentence-card__tools">
                <button className="listen-button" type="button" aria-label={`播放英文示范句子，${SPEECH_RATES[speechRateKey].label}`} onClick={listenToExample}>
                  <Volume2 size={16} /> 播放示范
                </button>
                <span>英文原声 · {SPEECH_RATES[speechRateKey].label}</span>
                <div className="speech-rate-control" role="group" aria-label="选择朗读速度">
                  <span className="speech-rate-control__label">朗读速度</span>
                  {(["normal", "slow"] as SpeechRateKey[]).map((rateKey) => (
                    <button
                      className={`speech-rate-control__option ${speechRateKey === rateKey ? "speech-rate-control__option--active" : ""}`}
                      key={rateKey}
                      type="button"
                      aria-pressed={speechRateKey === rateKey}
                      onClick={() => selectSpeechRate(rateKey)}
                    >
                      {SPEECH_RATES[rateKey].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="dialogue-card" aria-label="情景对话示例">
              <div className="dialogue-card__header">
                <div>
                  <p className="sentence-card__label"><MessageCircle size={14} /> 情景对话</p>
                  <h2>{practice.topic} · 跟读练习</h2>
                </div>
                <span>{practice.dialogue.length} 轮对话</span>
              </div>
              <div className="dialogue-card__lines">
                {practice.dialogue.map((line, index) => {
                  const lineKey = `${levelKey}-${sceneKey}-${index}`;
                  const isSpeaking = speakingLine === lineKey;
                  const isTranslating = translatingLine === lineKey;
                      return (
                        <div className={`dialogue-line ${isSpeaking ? "dialogue-line--speaking" : ""}`} key={lineKey}>
                          <div className="dialogue-line__speaker"><strong>{line.speaker}</strong><span>{index % 2 === 0 ? "练习句" : "对话伙伴"}</span></div>
                          <div className="dialogue-line__content">
                            <p><InteractiveSentence text={line.text} speechRate={SPEECH_RATES[speechRateKey].rate} onVocabChange={() => setSavedVocabCount(loadSavedWords().length)} /></p>
                        <div className="dialogue-line__actions">
                          <button className={`dialogue-action-button ${isSpeaking ? "dialogue-action-button--active" : ""}`} type="button" onClick={() => speakLine(lineKey, line.text)} aria-label={`朗读：${line.text}`}>
                            <Volume2 size={14} /> {isSpeaking ? "播放中" : "语音"}
                          </button>
                          <button className="dialogue-action-button" type="button" onClick={() => void translateLine(lineKey, line.text)} disabled={isTranslating} aria-expanded={Boolean(translatedLines[lineKey])}>
                            <Languages size={14} /> {isTranslating ? "翻译中…" : translatedLines[lineKey] ? "收起译文" : "翻译"}
                          </button>
                          <InlineRecorder
                            key={`${lineKey}-recorder`}
                            targetSentence={line.text}
                            onEvaluationReady={(result) => updateDailyStats((current) => ({
                              ...current,
                              recordings: current.recordings + 1,
                              accuracyScores: [...current.accuracyScores, result.accuracyScore],
                            }))}
                          />
                        </div>
                        {translatedLines[lineKey] && <p className="dialogue-line__translation" role="status"><Languages size={14} /> {translatedLines[lineKey]}</p>}
                        {lineActionError === lineKey && <p className="dialogue-line__error" role="alert">暂时无法完成操作，请稍后重试。</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <section className="ai-dialogue-card" aria-labelledby="ai-dialogue-heading">
              <div className="ai-dialogue-card__header">
                <div>
                  <p className="sentence-card__label"><Sparkles size={14} /> AI 口语对话</p>
                  <h2 id="ai-dialogue-heading">和 AI 练习真实交流</h2>
                  <p>先读懂 AI 的问题，再用英文回答。每一句对话都可以查看中文翻译。</p>
                </div>
                <div className="ai-dialogue-card__header-actions">
                  <span className="ai-dialogue-card__context">{level.label} · {practice.topic}</span>
                  <button
                    className={`ai-replay-button ${speakingLine === latestAIMessageKey ? "ai-replay-button--active" : ""}`}
                    type="button"
                    onClick={replayLatestAIMessage}
                    disabled={!latestAIMessage}
                    aria-label="重读上一句 AI 语音"
                    title="重读上一句 AI 语音"
                  >
                    <Repeat2 size={14} /> {speakingLine === latestAIMessageKey ? "播放中" : "重读"}
                  </button>
                </div>
              </div>

              <div className="ai-dialogue-thread" aria-live="polite">
                {aiMessages.map((message) => {
                  const messageKey = `ai-${message.id}`;
                  const isSpeaking = speakingLine === messageKey;
                  const isTranslating = translatingLine === messageKey;
                  return (
                    <div className={`ai-dialogue-message ai-dialogue-message--${message.role}`} key={message.id}>
                      <div className="ai-dialogue-message__avatar" aria-hidden="true">
                        {message.role === "assistant" ? <Bot size={16} /> : <MessageCircle size={16} />}
                      </div>
                      <div className="ai-dialogue-message__body">
                        <div className="ai-dialogue-message__meta">
                          <strong>{message.role === "assistant" ? "AI 教练" : "你"}</strong>
                          <span>{message.role === "assistant" ? "英语对话伙伴" : "你的回答"}</span>
                        </div>
                        <p><InteractiveSentence text={message.text} speechRate={SPEECH_RATES[speechRateKey].rate} onVocabChange={() => setSavedVocabCount(loadSavedWords().length)} /></p>
                        <div className="dialogue-line__actions">
                          <button className={`dialogue-action-button ${isSpeaking ? "dialogue-action-button--active" : ""}`} type="button" onClick={() => speakLine(messageKey, message.text)} aria-label={`朗读：${message.text}`}>
                            <Volume2 size={14} /> {isSpeaking ? "播放中" : "语音"}
                          </button>
                          <button className="dialogue-action-button" type="button" onClick={() => void translateLine(messageKey, message.text)} disabled={isTranslating} aria-expanded={Boolean(translatedLines[messageKey])}>
                            <Languages size={14} /> {isTranslating ? "翻译中…" : translatedLines[messageKey] ? "收起译文" : "翻译"}
                          </button>
                        </div>
                        {translatedLines[messageKey] && <p className="dialogue-line__translation" role="status"><Languages size={14} /> {translatedLines[messageKey]}</p>}
                      </div>
                    </div>
                  );
                })}
                {dialogueMutation.isPending && (
                  <div className="ai-dialogue-thinking" role="status"><span className="mini-spinner" /> AI 正在思考下一句…</div>
                )}
              </div>

              <form className="ai-dialogue-composer" onSubmit={(event) => { event.preventDefault(); void submitAIMessage(aiInput); }}>
                <label htmlFor="ai-dialogue-input">回答 AI <span>输入中文后会先生成英文表达建议</span></label>
                <div className="ai-dialogue-composer__row">
                  <input id="ai-dialogue-input" value={aiInput} onChange={(event) => handleAIInputChange(event.target.value)} placeholder="可输入中文或英文，例如：我今天感觉很好" maxLength={600} disabled={dialogueMutation.isPending || englishTranslationMutation.isPending || suggestionsMutation.isPending} />
                  <button
                    className="ai-dialogue-hint"
                    type="button"
                    onClick={() => void requestReplySuggestions()}
                    disabled={!latestAIMessage || dialogueMutation.isPending || englishTranslationMutation.isPending || suggestionsMutation.isPending}
                    aria-label="生成英文回复提示"
                  >
                    {suggestionsMutation.isPending ? <span className="mini-spinner" /> : <Lightbulb size={15} />} {suggestionsMutation.isPending ? "生成中…" : "提示"}
                  </button>
                  <button className="ai-dialogue-send" type="submit" disabled={!aiInput.trim() || dialogueMutation.isPending || englishTranslationMutation.isPending || suggestionsMutation.isPending}>
                    {englishTranslationMutation.isPending ? <span className="mini-spinner mini-spinner--light" /> : <Send size={15} />} {englishTranslationMutation.isPending ? "生成中…" : "发送"}
                  </button>
                </div>
                {suggestionsMutation.isPending && <p className="ai-dialogue-translation-status" role="status"><span className="mini-spinner" /> 正在生成 2-3 个英文回复建议…</p>}
                {englishTranslationMutation.isPending && <p className="ai-dialogue-translation-status" role="status"><span className="mini-spinner" /> 正在把中文转换成自然英文…</p>}
                {replySuggestions.length > 0 && (
                  <div className="ai-dialogue-suggestions" role="status" aria-label="英文回复建议">
                    <div className="ai-dialogue-suggestions__heading"><Lightbulb size={15} /><strong>英文回复提示</strong><span>点击建议即可填入输入框</span></div>
                    <div className="ai-dialogue-suggestions__list">
                      {replySuggestions.map((suggestion, index) => {
                        const suggestionKey = `reply-suggestion-${index}`;
                        const isSuggestionSpeaking = speakingLine === suggestionKey;
                        const isSuggestionTranslated = Boolean(translatedSuggestions[suggestionKey]);
                        const isSuggestionTranslating = translatingSuggestion === suggestionKey;
                        const hasSuggestionTranslationError = suggestionActionError?.key === suggestionKey && suggestionActionError.type === "translation";
                        return (
                          <div className={`ai-dialogue-suggestion ${isSuggestionSpeaking ? "ai-dialogue-suggestion--active" : ""}`} key={`${suggestion}-${index}`}>
                            <div className="ai-dialogue-suggestion__main">
                              <button className="ai-dialogue-suggestion__select" type="button" onClick={() => useReplySuggestion(suggestion)}>
                                <span className="ai-dialogue-suggestion__number">{index + 1}</span>
                                <span><InteractiveSentence text={suggestion} speechRate={SPEECH_RATES[speechRateKey].rate} onVocabChange={() => setSavedVocabCount(loadSavedWords().length)} /></span>
                              </button>
                              <div className="ai-dialogue-suggestion__actions">
                                <button
                                  className={`ai-dialogue-suggestion__speak ${isSuggestionSpeaking ? "ai-dialogue-suggestion__speak--active" : ""}`}
                                  type="button"
                                  onClick={() => speakLine(suggestionKey, suggestion)}
                                  aria-label={`朗读英文提示：${suggestion}`}
                                >
                                  <Volume2 size={14} /> {isSuggestionSpeaking ? "播放中" : "语音"}
                                </button>
                                <button
                                  className={`ai-dialogue-suggestion__translate ${isSuggestionTranslated ? "ai-dialogue-suggestion__translate--active" : ""}`}
                                  type="button"
                                  onClick={() => translateSuggestion(suggestionKey, suggestion)}
                                  disabled={isSuggestionTranslating}
                                  aria-label={`${isSuggestionTranslated ? "收起" : "查看"}英文提示中文翻译：${suggestion}`}
                                >
                                  <Languages size={14} /> {isSuggestionTranslating ? "翻译中…" : isSuggestionTranslated ? "收起" : "翻译"}
                                </button>
                              </div>
                            </div>
                            {translatedSuggestions[suggestionKey] && (
                              <p className="ai-dialogue-suggestion__translation" role="status"><span>中文</span>{translatedSuggestions[suggestionKey]}</p>
                            )}
                            {lineActionError === suggestionKey && (
                              <span className="ai-dialogue-suggestion__error" role="alert">暂时无法播放，请检查浏览器语音设置。</span>
                            )}
                            {hasSuggestionTranslationError && (
                              <span className="ai-dialogue-suggestion__error" role="alert">翻译暂时不可用，请稍后重试。</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {englishDraft && (
                  <div className="ai-dialogue-english-helper" role="status">
                    <div className="ai-dialogue-english-helper__heading"><Languages size={15} /><strong>英文回答建议</strong><span>确认后再发送给 AI</span></div>
                    <p><span>中文原句</span>{englishDraft.source}</p>
                    <p><span>自然英文</span>{englishDraft.translation}</p>
                    <button type="button" onClick={useEnglishDraft}><Languages size={14} /> 使用这句英文</button>
                  </div>
                )}
                <p className="ai-dialogue-composer__hint">也可以使用下方麦克风录音；如果中文被转写出来，也会先生成英文表达建议。</p>
              </form>

              {aiDialogueError && <p className="ai-dialogue-error" role="alert">{aiDialogueError}</p>}

              <Recorder
                key={`${levelKey}-${sceneKey}`}
                mode="dialogue"
                showHeader={false}
                showFootnote={false}
                onRecordingReady={({ url }) => {
                  setLastTake(url);
                  updateDailyStats((current) => ({ ...current, recordings: current.recordings + 1 }));
                }}
                onTranscriptionReady={(transcription) => void submitAIMessage(transcription.text)}
              />
              {lastTake && <p className="ai-dialogue-saved" role="status">录音已保存并已提交给 AI 对话。</p>}
            </section>
          </div>

          <aside className="learning-sidebar" id="progress">
            <section className="progress-card stats-card" aria-labelledby="daily-stats-heading">
              <div className="sidebar-heading">
                <span id="daily-stats-heading">今日练习统计</span>
                <strong>{level.label}</strong>
              </div>
              <p className="stats-card__summary">数据会随着今天的录音和 AI 评分自动更新。</p>
              <div className="stats-card__grid">
                <div className="stats-card__metric">
                  <strong>{dailyStats.practiceRounds}</strong>
                  <span>对话轮数</span>
                </div>
                <div className="stats-card__metric">
                  <strong>{dailyStats.recordings}</strong>
                  <span>发声次数</span>
                </div>
                <div className="stats-card__metric">
                  <strong>{dailyStats.accuracyScores.length}</strong>
                  <span>AI 评分</span>
                </div>
                <div className="stats-card__metric stats-card__metric--accent">
                  <strong>{averageAccuracy === null ? "—" : `${averageAccuracy}%`}</strong>
                  <span>平均准确率</span>
                </div>
              </div>
              <div className="stats-card__accuracy">
                <div className="stats-card__accuracy-heading">
                  <span>今日准确率</span>
                  <strong>{averageAccuracy === null ? "待评分" : `${averageAccuracy}%`}</strong>
                </div>
                <div className="progress-track" aria-label="今日平均准确率">
                  <span style={{ width: `${averageAccuracy ?? 0}%` }} />
                </div>
                <p>{dailyStats.accuracyScores.length > 0 ? `基于 ${dailyStats.accuracyScores.length} 次逐句 AI 评分` : "完成逐句 AI 评分后显示"}</p>
              </div>
            </section>

            <section className="progress-card stats-card mt-6" aria-labelledby="sidebar-vocab-heading">
              <div className="sidebar-heading">
                <span id="sidebar-vocab-heading">生词本</span>
                <strong>{sidebarVocabList.length} 个单词</strong>
              </div>
              <p className="stats-card__summary">集中复习你收藏的生词、音标、释义与语境例句。</p>

              <div className="mt-4 space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {sidebarVocabList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <p>生词本还是空的</p>
                    <p className="mt-1">在任意英文句子中点击单词即可加入。</p>
                  </div>
                ) : (
                  sidebarVocabList.map((item, index) => {
                    const sentenceKey = `sidebar-sentence-${item.word}-${index}`;
                    const isSentenceSpeaking = sidebarSpeakingKey === sentenceKey;
                    const isSentenceTranslating = sidebarTranslatingKey === sentenceKey;
                    const translatedText = sidebarSentenceTranslations[sentenceKey];

                    return (
                      <div key={`${item.word}-${index}`} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm capitalize">{item.word}</span>
                            <span className="font-mono text-[11px] text-slate-500">{item.phonetic}</span>
                            <button
                              type="button"
                              onClick={() => playSidebarWord(item.word)}
                              className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                              title="朗读单词"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{item.meaning}</span>
                        </div>

                        {item.sentence ? (
                          <div className="mt-1 pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                            <p className="text-xs text-slate-700 italic">“{item.sentence}”</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => playSidebarSentence(sentenceKey, item.sentence!)}
                                className={`text-[11px] px-2 py-1 rounded border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-medium flex items-center gap-1 transition-colors ${
                                  isSentenceSpeaking ? "bg-blue-100 border-blue-400" : ""
                                }`}
                              >
                                <Volume2 className="w-3 h-3" /> {isSentenceSpeaking ? "播放中" : "语音"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void translateSidebarSentence(sentenceKey, item.sentence!)}
                                disabled={isSentenceTranslating}
                                className={`text-[11px] px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1 transition-colors ${
                                  translatedText ? "border-blue-300 bg-blue-50/50 text-blue-800" : ""
                                }`}
                              >
                                <Languages className="w-3 h-3" /> {isSentenceTranslating ? "翻译中…" : translatedText ? "收起译文" : "翻译"}
                              </button>
                            </div>
                            {translatedText && (
                              <p className="text-[11px] text-slate-600 bg-blue-50/80 p-1.5 rounded border border-blue-100">
                                <strong>中文</strong>：{translatedText}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">暂无关联例句语境</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </section>
        </>
      )}
      </main>

      <footer className="learning-footer">
        <span>英语口语 · 练习助手</span>
        <span>{level.label} · {practice.topic}</span>
      </footer>

      <VocabNotebookModal
        isOpen={isVocabModalOpen}
        onClose={() => {
          setIsVocabModalOpen(false);
          refreshVocabData();
        }}
        speechRate={SPEECH_RATES[speechRateKey].rate}
        onWordRemoved={() => refreshVocabData()}
      />
    </div>
  );
}
