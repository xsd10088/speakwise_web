import React, { useState, useEffect, useRef } from "react";
import { Volume2, X, Bookmark, BookMarked } from "lucide-react";

export type SavedWord = {
  word: string;
  phonetic: string;
  meaning: string;
  sentence?: string;
  savedAt: number;
};

const VOCAB_STORAGE_KEY = "speakwise-vocab-notebook";

export const loadSavedWords = (): SavedWord[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(VOCAB_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveWordsToStorage = (words: SavedWord[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(words));
  } catch {}
};

const DICTIONARY: Record<string, { phonetic: string; meaning: string }> = {
  // Common pronouns, verbs, prepositions & auxiliary
  i: { phonetic: "/aɪ/", meaning: "我" },
  me: { phonetic: "/miː/", meaning: "我（宾格）" },
  my: { phonetic: "/maɪ/", meaning: "我的" },
  mine: { phonetic: "/maɪn/", meaning: "我的（名词性）" },
  you: { phonetic: "/juː/", meaning: "你，你们" },
  your: { phonetic: "/jʊər/", meaning: "你的，你们的" },
  yours: { phonetic: "/jʊərz/", meaning: "你的（东西）" },
  he: { phonetic: "/hiː/", meaning: "他" },
  him: { phonetic: "/hɪm/", meaning: "他（宾格）" },
  his: { phonetic: "/hɪz/", meaning: "他的" },
  she: { phonetic: "/ʃiː/", meaning: "她" },
  her: { phonetic: "/hɜːr/", meaning: "她，她的" },
  it: { phonetic: "/ɪt/", meaning: "它" },
  its: { phonetic: "/ɪts/", meaning: "它的" },
  we: { phonetic: "/wiː/", meaning: "我们" },
  us: { phonetic: "/ʌs/", meaning: "我们（宾格）" },
  our: { phonetic: "/aʊər/", meaning: "我们的" },
  they: { phonetic: "/ðeɪ/", meaning: "他们，她们，它们" },
  them: { phonetic: "/ðɛm/", meaning: "他们（宾格）" },
  their: { phonetic: "/ðɛər/", meaning: "他们的" },
  this: { phonetic: "/ðɪs/", meaning: "这个" },
  that: { phonetic: "/ðæt/", meaning: "那个" },
  these: { phonetic: "/ðiːz/", meaning: "这些" },
  those: { phonetic: "/ðoʊz/", meaning: "那些" },
  who: { phonetic: "/huː/", meaning: "谁" },
  what: { phonetic: "/wʌt/", meaning: "什么" },
  which: { phonetic: "/wɪtʃ/", meaning: "哪一个" },
  where: { phonetic: "/wɛər/", meaning: "哪里" },
  when: { phonetic: "/wɛn/", meaning: "什么时候" },
  why: { phonetic: "/waɪ/", meaning: "为什么" },
  // duplicate how removed

  // Be verbs & auxiliaries
  am: { phonetic: "/æm/", meaning: "是（第一人称单数）" },
  is: { phonetic: "/ɪz/", meaning: "是（第三人称单数）" },
  are: { phonetic: "/ɑːr/", meaning: "是（复数/第二人称）" },
  was: { phonetic: "/wɒz/", meaning: "是（过去式单数）" },
  were: { phonetic: "/wɜːr/", meaning: "是（过去式复数）" },
  be: { phonetic: "/biː/", meaning: "是，成为" },
  been: { phonetic: "/bɪn/", meaning: "已经（be的过去分词）" },
  being: { phonetic: "/ˈbiːɪŋ/", meaning: "成为，存在" },
  have: { phonetic: "/hæv/", meaning: "有，进行" },
  has: { phonetic: "/hæz/", meaning: "有（第三人称单数）" },
  had: { phonetic: "/hæd/", meaning: "有（过去式）" },
  do: { phonetic: "/duː/", meaning: "做，干" },
  does: { phonetic: "/dʌz/", meaning: "做（第三人称单数）" },
  did: { phonetic: "/dɪd/", meaning: "做（过去式）" },
  will: { phonetic: "/wɪl/", meaning: "将要，会" },
  would: { phonetic: "/wʊd/", meaning: "会，愿意" },
  can: { phonetic: "/kæn/", meaning: "能，会" },
  could: { phonetic: "/kʊd/", meaning: "能，可以（过去式）" },
  shall: { phonetic: "/ʃæl/", meaning: "将要，应该" },
  should: { phonetic: "/ʃʊd/", meaning: "应该" },
  may: { phonetic: "/meɪ/", meaning: "可以，也许" },
  might: { phonetic: "/maɪt/", meaning: "也许，可能" },
  must: { phonetic: "/mʌst/", meaning: "必须，一定要" },

  // Greetings & conversational fillers
  hi: { phonetic: "/haɪ/", meaning: "嗨，你好" },
  hello: { phonetic: "/həˈloʊ/", meaning: "你好" },
  hey: { phonetic: "/heɪ/", meaning: "嘿，喂" },
  morning: { phonetic: "/ˈmɔːrnɪŋ/", meaning: "早晨，上午" },
  afternoon: { phonetic: "/ˌæftərˈnuːn/", meaning: "下午" },
  evening: { phonetic: "/ˈiːvnɪŋ/", meaning: "傍晚，晚上" },
  bye: { phonetic: "/baɪ/", meaning: "再见" },
  goodbye: { phonetic: "/ɡʊdˈbaɪ/", meaning: "再见" },
  thanks: { phonetic: "/θæŋks/", meaning: "谢谢" },
  thank: { phonetic: "/θæŋk/", meaning: "感谢" },
  please: { phonetic: "/pliːz/", meaning: "请" },
  sorry: { phonetic: "/ˈsɒri/", meaning: "对不起，抱歉" },
  excuse: { phonetic: "/ɪkˈskjuːz/", meaning: "原谅，打扰" },
  sure: { phonetic: "/ʃʊr/", meaning: "当然，确信的" },
  certainly: { phonetic: "/ˈsɜːrtənli/", meaning: "当然可以，一定" },
  // duplicate definitely removed
  absolutely: { phonetic: "/ˈæbsəluːtli/", meaning: "绝对地，完全正确" },
  okay: { phonetic: "/oʊˈkeɪ/", meaning: "好的，行" },
  ok: { phonetic: "/oʊˈkeɪ/", meaning: "好的" },
  yes: { phonetic: "/jɛs/", meaning: "是的，对" },
  no: { phonetic: "/noʊ/", meaning: "不，不是" },
  not: { phonetic: "/nɒt/", meaning: "不，没有" },
  oh: { phonetic: "/oʊ/", meaning: "哦，呀" },
  ah: { phonetic: "/ɑː/", meaning: "啊，呀" },
  well: { phonetic: "/wɛl/", meaning: "嗯，好地，健康" },
  so: { phonetic: "/soʊ/", meaning: "如此，所以，非常" },
  too: { phonetic: "/tuː/", meaning: "也，太，过于" },
  very: { phonetic: "/ˈvɛri/", meaning: "非常，很" },
  // duplicate quite removed
  just: { phonetic: "/dʒʌst/", meaning: "刚刚，仅仅，只是" },
  really: { phonetic: "/ˈriːli/", meaning: "真正地，确实" },
  actually: { phonetic: "/ˈæktʃuəli/", meaning: "事实上，其实" },
  maybe: { phonetic: "/ˈmeɪbi/", meaning: "也许，可能" },
  perhaps: { phonetic: "/pərˈhæps/", meaning: "也许" },

  // Names appearing in dialogues
  alex: { phonetic: "/ˈælɪks/", meaning: "亚历克斯（人名）" },
  mia: { phonetic: "/ˈmiːə/", meaning: "米娅（人名）" },
  sam: { phonetic: "/sæm/", meaning: "萨姆（人名）" },
  lee: { phonetic: "/liː/", meaning: "李（人名）" },
  jamie: { phonetic: "/ˈdʒeɪmi/", meaning: "杰米（人名）" },
  taylor: { phonetic: "/ˈteɪlər/", meaning: "泰勒（人名）" },
  morgan: { phonetic: "/ˈmɔːrɡən/", meaning: "摩根（人名）" },
  casey: { phonetic: "/ˈkeɪsi/", meaning: "凯西（人名）" },
  jordan: { phonetic: "/ˈdʒɔːrdən/", meaning: "乔丹（人名）" },
  riley: { phonetic: "/ˈraɪli/", meaning: "莱利（人名）" },

  // Daily life & conversational vocabulary
  nice: { phonetic: "/naɪs/", meaning: "美好的，友好的，漂亮的" },
  meet: { phonetic: "/miːt/", meaning: "遇见，会面，相识" },
  meeting: { phonetic: "/ˈmiːtɪŋ/", meaning: "会议，会面" },
  // duplicate how removed
  today: { phonetic: "/təˈdeɪ/", meaning: "今天" },
  // duplicate good removed
  about: { phonetic: "/əˈbaʊt/", meaning: "关于，大约" },
  doing: { phonetic: "/ˈduːɪŋ/", meaning: "做，干（do的ing形式）" },
  great: { phonetic: "/ɡreɪt/", meaning: "伟大的，很棒的" },
  new: { phonetic: "/nuː/", meaning: "新的，新鲜的" },
  neighborhood: { phonetic: "/ˈneɪbərhʊd/", meaning: "街区，邻近地区" },
  moved: { phonetic: "/muːvd/", meaning: "搬家，移动（move的过去式）" },
  move: { phonetic: "/muːv/", meaning: "移动，搬家" },
  in: { phonetic: "/ɪn/", meaning: "在...里面，加入" },
  last: { phonetic: "/læst/", meaning: "上一个的，持续" },
  weekend: { phonetic: "/ˈwiːkɛnd/", meaning: "周末" },
  wonderful: { phonetic: "/ˈwʌndərfəl/", meaning: "美妙的，精彩的" },
  welcome: { phonetic: "/ˈwɛlkəm/", meaning: "欢迎" },
  community: { phonetic: "/kəˈmjuːnəti/", meaning: "社区，社会" },
  much: { phonetic: "/mʌtʃ/", meaning: "许多，大量" },
  live: { phonetic: "/lɪv/", meaning: "居住，生活" },
  // duplicate around removed
  // duplicate here removed
  down: { phonetic: "/daʊn/", meaning: "向下，沿着" },
  street: { phonetic: "/striːt/", meaning: "街道，马路" },
  // duplicate let removed
  know: { phonetic: "/noʊ/", meaning: "知道，了解" },
  if: { phonetic: "/ɪf/", meaning: "如果，是否" },
  need: { phonetic: "/niːd/", meaning: "需要" },
  any: { phonetic: "/ˈɛni/", meaning: "任何的，一些" },
  recommendations: { phonetic: "/ˌrɛkəmɛnˈdeɪʃənz/", meaning: "推荐，建议（复数）" },
  recommendation: { phonetic: "/ˌrɛkəmɛnˈdeɪʃən/", meaning: "推荐，建议" },
  // duplicate definitely removed
  for: { phonetic: "/fɔːr/", meaning: "为了，给，持续" },
  // duplicate kind removed
  sleep: { phonetic: "/sliːp/", meaning: "睡觉，睡眠" },
  slept: { phonetic: "/slɛpt/", meaning: "睡觉（过去式）" },
  night: { phonetic: "/naɪt/", meaning: "夜晚，晚上" },
  stayed: { phonetic: "/steɪd/", meaning: "呆，停留（stay的过去式）" },
  // duplicate stay removed
  bit: { phonetic: "/bɪt/", meaning: "一点儿，稍微" },
  late: { phonetic: "/leɪt/", meaning: "迟的，晚的" },
  reading: { phonetic: "/ˈriːdɪŋ/", meaning: "阅读，读书" },
  // duplicate read removed
  kind: { phonetic: "/kaɪnd/", meaning: "种类，亲切的" },
  book: { phonetic: "/bʊk/", meaning: "书，书籍" },
  books: { phonetic: "/bʊks/", meaning: "书（复数）" },
  anything: { phonetic: "/ˈɛniθɪŋ/", meaning: "任何事物，什么事" },
  interesting: { phonetic: "/ˈɪntrəstɪŋ/", meaning: "有趣的，引人入胜的" },
  novel: { phonetic: "/ˈnɒvəl/", meaning: "小说" },
  art: { phonetic: "/ɑːrt/", meaning: "艺术，美术" },
  history: { phonetic: "/ˈhɪstəri/", meaning: "历史" },
  // duplicate quite removed
  fascinating: { phonetic: "/ˈfæsɪneɪtɪŋ/", meaning: "迷人的，极有吸引力的" },
  always: { phonetic: "/ˈɔːlweɪz/", meaning: "总是，一直" },
  found: { phonetic: "/faʊnd/", meaning: "发现，觉得（find的过去式）" },
  find: { phonetic: "/faɪnd/", meaning: "发现，寻找" },
  inspiring: { phonetic: "/ɪnˈspaɪərɪŋ/", meaning: "鼓舞人心的，启发灵感的" },
  visit: { phonetic: "/ˈvɪzɪt/", meaning: "参观，拜访" },
  galleries: { phonetic: "/ˈɡæləriz/", meaning: "画廊，美术馆（复数）" },
  gallery: { phonetic: "/ˈɡæləri/", meaning: "画廊，美术馆" },
  often: { phonetic: "/ˈɔːfən/", meaning: "经常，常常" },
  whenever: { phonetic: "/wɛnˈɛvər/", meaning: "每当，无论何时" },
  free: { phonetic: "/friː/", meaning: "有空的，自由的，免费的" },
  try: { phonetic: "/traɪ/", meaning: "尝试，努力" },
  check: { phonetic: "/tʃɛk/", meaning: "检查，查看" },
  exhibition: { phonetic: "/ˌɛksɪˈbɪʃən/", meaning: "展览，展览会" },
  sounds: { phonetic: "/saʊndz/", meaning: "听起来" },
  sound: { phonetic: "/saʊnd/", meaning: "声音，听起来" },
  habit: { phonetic: "/ˈhæbɪt/", meaning: "习惯" },
  by: { phonetic: "/baɪ/", meaning: "通过，在...旁边" },
  way: { phonetic: "/weɪ/", meaning: "路，方式" },
  heading: { phonetic: "/ˈhɛdɪŋ/", meaning: "前往，标题" },
  head: { phonetic: "/hɛd/", meaning: "头部，前往" },
  work: { phonetic: "/wɜːrk/", meaning: "工作" },
  taking: { phonetic: "/ˈteɪkɪŋ/", meaning: "乘坐，拿取（take的ing）" },
  take: { phonetic: "/teɪk/", meaning: "拿，乘坐，花费" },
  subway: { phonetic: "/ˈsʌbweɪ/", meaning: "地铁" },
  usually: { phonetic: "/ˈjuːʒuəli/", meaning: "通常，惯常" },
  hour: { phonetic: "/ˈaʊər/", meaning: "小时" },
  true: { phonetic: "/truː/", meaning: "真实的，正确的" },
  breakfast: { phonetic: "/ˈbrɛkfəst/", meaning: "早餐" },
  yet: { phonetic: "/jɛt/", meaning: "还（用于否定/疑问句）" },
  or: { phonetic: "/ɔːr/", meaning: "或者，还是" },
  grabbing: { phonetic: "/ˈɡræbɪŋ/", meaning: "匆忙买，抓取" },
  grab: { phonetic: "/ɡræb/", meaning: "抓取，夺取" },
  coffee: { phonetic: "/ˈkɔːfi/", meaning: "咖啡" },
  on: { phonetic: "/ɒn/", meaning: "在...上面，在...时候" },
  the: { phonetic: "/ðə/", meaning: "这，那（定冠词）" },
  a: { phonetic: "/ə/", meaning: "一个（不定冠词）" },
  an: { phonetic: "/æn/", meaning: "一个（元音前）" },
  pastry: { phonetic: "/ˈpeɪstri/", meaning: "糕点，面点" },
  latte: { phonetic: "/ˈlæteɪ/", meaning: "拿铁咖啡" },
  near: { phonetic: "/nɪər/", meaning: "在...附近" },
  station: { phonetic: "/ˈsteɪʃən/", meaning: "车站，所，局" },
  main: { phonetic: "/meɪn/", meaning: "主要的，最重要的" },
  tasks: { phonetic: "/tæsks/", meaning: "任务，工作（复数）" },
  task: { phonetic: "/tæsk/", meaning: "任务，工作" },
  scheduled: { phonetic: "/ˈskɛdʒuːld/", meaning: "预定的，安排好的" },
  schedule: { phonetic: "/ˈskɛdʒuːl/", meaning: "日程表，计划" },
  finalize: { phonetic: "/ˈfaɪnəlaɪz/", meaning: "使最终确定，定稿" },
  quarterly: { phonetic: "/ˈkwɔːrtərli/", meaning: "季度的" },
  design: { phonetic: "/dɪˈzaɪn/", meaning: "设计" },
  report: { phonetic: "/rɪˈpɔːrt/", meaning: "报告，汇报" },
  review: { phonetic: "/rɪˈvjuː/", meaning: "审查，复习" },
  team: { phonetic: "/tiːm/", meaning: "团队" },
  feedback: { phonetic: "/ˈfiːdbæk/", meaning: "反馈意见" },
  productive: { phonetic: "/prəˈdʌktɪv/", meaning: "富有成效的" },
  ahead: { phonetic: "/əˈhɛd/", meaning: "在前面，提前" },
  luck: { phonetic: "/lʌk/", meaning: "运气，好运" },
  remote: { phonetic: "/rɪˈmoʊt/", meaning: "遥远的，远程的" },
  office: { phonetic: "/ˈɒfɪs/", meaning: "办公室" },
  brainstorming: { phonetic: "/ˈbreɪnstɔːrmɪŋ/", meaning: "头脑风暴" },
  session: { phonetic: "/ˈsɛʃən/", meaning: "一场，会议，学期" },
  collaboration: { phonetic: "/ˌkɒlæbəˈreɪʃən/", meaning: "合作，协作" },
  energetic: { phonetic: "/ˌɛnərˈdʒɛtɪk/", meaning: "精力充沛的，充满活力的" },
  hope: { phonetic: "/hoʊp/", meaning: "希望" },
  ideas: { phonetic: "/aɪˈdiːəz/", meaning: "主意，想法（复数）" },
  idea: { phonetic: "/aɪˈdiːə/", meaning: "主意，想法" },
  // duplicate certainly removed
  look: { phonetic: "/lʊk/", meaning: "看，显得" },
  weather: { phonetic: "/ˈwɛðər/", meaning: "天气" },
  outside: { phonetic: "/ˌaʊtˈsaɪd/", meaning: "外面，外部" },
  looks: { phonetic: "/lʊks/", meaning: "看起来" },
  rain: { phonetic: "/reɪn/", meaning: "下雨，雨水" },
  good: { phonetic: "/ɡʊd/", meaning: "好的" },
  thing: { phonetic: "/θɪŋ/", meaning: "事情，东西" },
  packed: { phonetic: "/pækt/", meaning: "收拾行李，装满（pack的过去式）" },
  pack: { phonetic: "/pæk/", meaning: "打包，收拾" },
  umbrella: { phonetic: "/ʌmˈbrɛlə/", meaning: "雨伞" },
  bag: { phonetic: "/bæɡ/", meaning: "包，袋子" },
  bags: { phonetic: "/bæɡz/", meaning: "包，行李" },
  foresight: { phonetic: "/ˈfɔːrsaɪt/", meaning: "远见，深谋远虑" },
  prepared: { phonetic: "/prɪˈpɛrd/", meaning: "准备好的" },
  prepare: { phonetic: "/prɪˈpɛər/", meaning: "准备" },
  unexpected: { phonetic: "/ˌʌnɪkˈspɛktɪd/", meaning: "意想不到的" },
  showers: { phonetic: "/ˈʃaʊərz/", meaning: "阵雨（复数）" },
  shower: { phonetic: "/ˈʃaʊər/", meaning: "阵雨，淋浴" },
  stop: { phonetic: "/stɒp/", meaning: "车站，停止" },
  coming: { phonetic: "/ˈkʌmɪŋ/", meaning: "来临的，即将到来的" },
  come: { phonetic: "/kʌm/", meaning: "来，来到" },
  enjoy: { phonetic: "/ɪnˈdʒɔɪ/", meaning: "享受，欣赏" },
  day: { phonetic: "/deɪ/", meaning: "天，日子" },
  days: { phonetic: "/deɪz/", meaning: "天，日子（复数）" },
  stay: { phonetic: "/steɪ/", meaning: "保持，停留" },
  dry: { phonetic: "/draɪ/", meaning: "干燥的，保持干爽" },
  // duplicate will removed
  catch: { phonetic: "/kætʃ/", meaning: "赶上，抓牢" },
  later: { phonetic: "/ˈleɪtər/", meaning: "后来，稍后" },
  online: { phonetic: "/ˈɒnlaɪn/", meaning: "在线的，联网的" },
  plans: { phonetic: "/plænz/", meaning: "计划（复数）" },
  plan: { phonetic: "/plæn/", meaning: "计划" },
  // duplicate goodbye removed
  bakery: { phonetic: "/ˈbeɪkəri/", meaning: "面包店" },
  downtown: { phonetic: "/ˌdaʊnˈtaʊn/", meaning: "闹市区，市中心" },
  yesterday: { phonetic: "/ˈjɛstərdeɪ/", meaning: "昨天" },
  cinnamon: { phonetic: "/ˈsɪnəmən/", meaning: "肉桂" },
  rolls: { phonetic: "/roʊlz/", meaning: "卷，面包卷（复数）" },
  roll: { phonetic: "/roʊl/", meaning: "卷，面包卷" },
  absolute: { phonetic: "/ˈæbsəluːt/", meaning: "绝对的，完全的" },
  perfection: { phonetic: "/pərˈfɛkʃən/", meaning: "完美" },
  // duplicate must removed
  regret: { phonetic: "/rɪˈɡrɛt/", meaning: "后悔，遗憾" },
  arrive: { phonetic: "/əˈraɪv/", meaning: "到达，抵达" },
  early: { phonetic: "/ˈɜːrli/", meaning: "早的，提早" },
  before: { phonetic: "/bɪˈfɔːr/", meaning: "在...之前" },
  lines: { phonetic: "/laɪnz/", meaning: "队伍，排队（复数）" },
  line: { phonetic: "/laɪn/", meaning: "排，队伍，线" },
  form: { phonetic: "/fɔːrm/", meaning: "形成，表格" },
  got: { phonetic: "/ɡɒt/", meaning: "得到，明白（get的过去式）" },
  get: { phonetic: "/ɡɛt/", meaning: "得到，到达" },
  bird: { phonetic: "/bɜːrd/", meaning: "鸟" },
  delicious: { phonetic: "/dɪˈlɪʃəs/", meaning: "美味的，可口的" },
  haha: { phonetic: "/ˌhɑːˈhɑː/", meaning: "哈哈（笑声）" },
  exactly: { phonetic: "/ɪɡˈzæktli/", meaning: "精确地，完全正确" },
  // duplicate around, take removed
  care: { phonetic: "/kɛər/", meaning: "照顾，小心" },
  cheers: { phonetic: "/tʃɪərz/", meaning: "干杯，谢谢，再见" },
  lovely: { phonetic: "/ˈlʌvli/", meaning: "可爱的，美好的" },
  week: { phonetic: "/wiːk/", meaning: "星期，周" },
  reminding: { phonetic: "/rɪˈmaɪndɪŋ/", meaning: "提醒" },
  remind: { phonetic: "/rɪˈmaɪnd/", meaning: "提醒" },
  problem: { phonetic: "/ˈprɒbləm/", meaning: "问题，难题" },

  // Travel & Airport Vocabulary
  // duplicate excuse, could removed
  direct: { phonetic: "/dəˈrɛkt/", meaning: "指引，直接的" },
  international: { phonetic: "/ˌɪntərˈnæʃənəl/", meaning: "国际的" },
  departures: { phonetic: "/dɪˈpɑːrtʃərz/", meaning: "出发（复数）" },
  departure: { phonetic: "/dɪˈpɑːrtʃər/", meaning: "出发，起飞" },
  terminal: { phonetic: "/ˈtɜːrmɪnəl/", meaning: "航站楼，终点站" },
  // duplicate certainly, head removed
  straight: { phonetic: "/streɪt/", meaning: "笔直地" },
  corridor: { phonetic: "/ˈkɒrɪdɔːr/", meaning: "走廊，过道" },
  then: { phonetic: "/ðɛn/", meaning: "然后，当时" },
  escalator: { phonetic: "/ˈɛskəleɪtər/", meaning: "自动扶梯" },
  level: { phonetic: "/ˈlɛvəl/", meaning: "水平，层" },
  two: { phonetic: "/tuː/", meaning: "二，两" },
  currency: { phonetic: "/ˈkɜːrənsi/", meaning: "货币，通货" },
  exchange: { phonetic: "/ɪksˈtʃeɪndʒ/", meaning: "兑换，交流" },
  desk: { phonetic: "/dɛsk/", meaning: "服务台，桌子" },
  security: { phonetic: "/sɪˈkjʊrəti/", meaning: "安全，安检" },
  checkpoint: { phonetic: "/ˈtʃɛkpɔɪnt/", meaning: "检查站，安检处" },
  right: { phonetic: "/raɪt/", meaning: "右边，正确的，就在" },
  next: { phonetic: "/nɛkst/", meaning: "下一个，紧邻" },
  gate: { phonetic: "/ɡeɪt/", meaning: "登机口，大门" },
  offer: { phonetic: "/ˈɒfər/", meaning: "提供" },
  competitive: { phonetic: "/kəmˈpɛtɪtɪv/", meaning: "有竞争力的" },
  // duplicate rates/rate removed
  fill: { phonetic: "/fɪl/", meaning: "填写，装满" },
  out: { phonetic: "/aʊt/", meaning: "向外，出" },
  customs: { phonetic: "/ˈkʌstəmz/", meaning: "海关" },
  declaration: { phonetic: "/ˌdɛkləˈreɪʃən/", meaning: "申报，宣言" },
  forms: { phonetic: "/fɔːrmz/", meaning: "表格（复数）" },
  // duplicate form removed
  beforehand: { phonetic: "/bɪˈfɔːrhænd/", meaning: "预先，事先" },
  only: { phonetic: "/ˈoʊnli/", meaning: "仅仅，只有" },
  carrying: { phonetic: "/ˈkæriɪŋ/", meaning: "携带" },
  carry: { phonetic: "/ˈkæri/", meaning: "携带，搬运" },
  goods: { phonetic: "/ɡʊdz/", meaning: "货物，商品" },
  exceeding: { phonetic: "/ɪkˈsiːdɪŋ/", meaning: "超过，超出" },
  exceed: { phonetic: "/ɪkˈsiːd/", meaning: "超过" },
  duty: { phonetic: "/ˈduːti/", meaning: "关税，责任" },
  // duplicate free removed
  allowance: { phonetic: "/əˈlaʊəns/", meaning: "津贴，额度" },
  personal: { phonetic: "/ˈpɜːrsənəl/", meaning: "个人的，私人的" },
  belongings: { phonetic: "/bɪˈlɒŋɪŋz/", meaning: "随身物品，行李" },
  souvenirs: { phonetic: "/ˌsuːvəˈnɪərz/", meaning: "纪念品（复数）" },
  souvenir: { phonetic: "/ˌsuːvəˈnɪər/", meaning: "纪念品" },
  // duplicate should removed
  straightforward: { phonetic: "/ˌstreɪtˈfɔːrwərd/", meaning: "简单的，坦率的" },
  passport: { phonetic: "/ˈpæspɔːrt/", meaning: "护照" },
  boarding: { phonetic: "/ˈbɔːrdɪŋ/", meaning: "登机" },
  pass: { phonetic: "/pæs/", meaning: "通行证，通过" },
  ready: { phonetic: "/ˈrɛdi/", meaning: "准备好的" },
  here: { phonetic: "/hɪr/", meaning: "在这里" },
  flight: { phonetic: "/flaɪt/", meaning: "航班，飞行" },
  leaves: { phonetic: "/liːvz/", meaning: "离开（leave的第三人称单数/复数）" },
  leave: { phonetic: "/liːv/", meaning: "离开" },
  pm: { phonetic: "/piː ɛm/", meaning: "下午" },
  // duplicate am, let, me, check, which removed
  london: { phonetic: "/ˈlʌndən/", meaning: "伦敦（英国首都）" },
  begins: { phonetic: "/bɪˈɡɪnz/", meaning: "开始（begin的第三人称单数）" },
  begin: { phonetic: "/bɪˈɡɪn/", meaning: "开始" },
  conducted: { phonetic: "/kənˈdʌktɪd/", meaning: "进行，实施" },
  conduct: { phonetic: "/kənˈdʌkt/", meaning: "管理，引导" },
  b22: { phonetic: "/biː ˈtwɛnti tuː/", meaning: "B22号登机口" },
  located: { phonetic: "/ˈloʊkeɪtɪd/", meaning: "位于，坐落于" },
  locate: { phonetic: "/ˈloʊkeɪt/", meaning: "找出，定位" },
  far: { phonetic: "/fɑːr/", meaning: "远的" },
  end: { phonetic: "/ɛnd/", meaning: "尽头，结束" },
  concourse: { phonetic: "/ˈkɒŋkɔːrs/", meaning: "候机大厅，中央大厅" },
  // duplicate thank removed
  precise: { phonetic: "/prɪˈsaɪs/", meaning: "精确的，准确的" },
  information: { phonetic: "/ˌɪnfərˈmeɪʃən/", meaning: "信息，情报" },
  delays: { phonetic: "/dɪˈleɪz/", meaning: "延误，耽搁（复数）" },
  delay: { phonetic: "/dɪˈleɪ/", meaning: "延误，推迟" },
  reported: { phonetic: "/rɪˈpɔːrtɪd/", meaning: "报道的，报告的" },
  moment: { phonetic: "/ˈmoʊmənt/", meaning: "片刻，目前" },
  conditions: { phonetic: "/kənˈdɪʃənz/", meaning: "条件，状况（复数）" },
  condition: { phonetic: "/kənˈdɪʃən/", meaning: "条件，状况" },
  along: { phonetic: "/əˈlɒŋ/", meaning: "沿着" },
  route: { phonetic: "/ruːt/", meaning: "路线，航线" },
  clear: { phonetic: "/klɪər/", meaning: "晴朗的，清楚的" },
  relief: { phonetic: "/rɪˈliːf/", meaning: "宽慰，解脱" },
  guitar: { phonetic: "/ɡɪˈtɑːr/", meaning: "吉他" },
  luggage: { phonetic: "/ˈlʌɡɪdʒ/", meaning: "行李" },
  baggage: { phonetic: "/ˈbæɡɪdʒ/", meaning: "行李" },
  long: { phonetic: "/lɒŋ/", meaning: "长的" },
  as: { phonetic: "/æz/", meaning: "像，作为，只要" },
  fits: { phonetic: "/fɪts/", meaning: "适合，安放得下" },
  fit: { phonetic: "/fɪt/", meaning: "适合，合身" },
  overhead: { phonetic: "/ˌoʊvərˈhɛd/", meaning: "头顶上的" },
  bin: { phonetic: "/bɪn/", meaning: "舱，箱子" },
  under: { phonetic: "/ˈʌndər/", meaning: "在...下面" },
  seat: { phonetic: "/siːt/", meaning: "座位" },
  front: { phonetic: "/frʌnt/", meaning: "前面" },
  measured: { phonetic: "/ˈmɛʒərd/", meaning: "测量（measure的过去式）" },
  measure: { phonetic: "/ˈmɛʒər/", meaning: "测量" },
  complies: { phonetic: "/kəmˈplaɪz/", meaning: "遵守，符合" },
  comply: { phonetic: "/kəmˈplaɪ/", meaning: "遵守" },
  dimension: { phonetic: "/daɪˈmɛnʃən/", meaning: "尺寸，维度" },
  limits: { phonetic: "/ˈlɪmɪts/", meaning: "限制（复数）" },
  limit: { phonetic: "/ˈlɪmɪt/", meaning: "限制" },
  tag: { phonetic: "/tæɡ/", meaning: "标签，标牌" },
  tight: { phonetic: "/taɪt/", meaning: "紧的，紧张的" },
  understood: { phonetic: "/ˌʌndərˈstʊd/", meaning: "明白了（understand的过去式）" },
  understand: { phonetic: "/ˌʌndərˈstænd/", meaning: "理解，明白" },
  nearest: { phonetic: "/ˈnɪrɪst/", meaning: "最近的" },
  lounge: { phonetic: "/laʊndʒ/", meaning: "休息室" },
  frequent: { phonetic: "/ˈfriːkwənt/", meaning: "频繁的，常客" },
  flyers: { phonetic: "/ˈflaɪərz/", meaning: "飞行员，常旅客（复数）" },
  flyer: { phonetic: "/ˈflaɪər/", meaning: "传单，旅客" },
  elevator: { phonetic: "/ˈɛləveɪtər/", meaning: "电梯" },
  opposite: { phonetic: "/ˈɒpəzɪt/", meaning: "对面的" },
  bookstore: { phonetic: "/ˈbʊkˌstɔːr/", meaning: "书店" },
  third: { phonetic: "/θɜːrd/", meaning: "第三" },
  floor: { phonetic: "/flɔːr/", meaning: "地板，楼层" },
  appreciate: { phonetic: "/əˈpriːʃieɪt/", meaning: "感激，欣赏" },
  immense: { phonetic: "/ɪˈmɛns/", meaning: "巨大的，极大的" },
  assistance: { phonetic: "/əˈsɪstəns/", meaning: "协助，帮助" },
  pleasant: { phonetic: "/ˈplɛzənt/", meaning: "令人愉快的" },
  journey: { phonetic: "/ˈdʒɜːrni/", meaning: "旅程，旅行" },
  safe: { phonetic: "/seɪf/", meaning: "安全的" },
  travels: { phonetic: "/ˈtrævəlz/", meaning: "旅行（复数）" },
  connect: { phonetic: "/kəˈnɛkt/", meaning: "连接，连通" },
  browser: { phonetic: "/ˈbraʊzər/", meaning: "浏览器" },
  accept: { phonetic: "/əkˈsɛpt/", meaning: "接受" },
  terms: { phonetic: "/tɜːrmz/", meaning: "条款，条件（复数）" },
  term: { phonetic: "/tɜːrm/", meaning: "术语，学期，条款" },
  convenient: { phonetic: "/kənˈviːniənt/", meaning: "方便的，便利的" },
  checking: { phonetic: "/ˈtʃɛkɪŋ/", meaning: "检查，核对" },
  emails: { phonetic: "/ˈiːmeɪlz/", meaning: "电子邮件（复数）" },
  email: { phonetic: "/ˈiːmeɪl/", meaning: "电子邮件" },
  indeed: { phonetic: "/ɪnˈdiːd/", meaning: "确实，实在" },
  shift: { phonetic: "/ʃɪft/", meaning: "值班，轮班" },

  // Business Vocabulary
  // duplicate team/prepared/quarterly removed
  marketing: { phonetic: "/ˈmɑːrkɪtɪŋ/", meaning: "市场营销" },
  performance: { phonetic: "/pərˈfɔːrməns/", meaning: "表现，业绩" },
  slides: { phonetic: "/slaɪdz/", meaning: "幻灯片（复数）" },
  slide: { phonetic: "/slaɪd/", meaning: "幻灯片" },
  excellent: { phonetic: "/ˈɛksələnt/", meaning: "优秀的，杰出的" },
  start: { phonetic: "/stɑːrt/", meaning: "开始" },
  reviewing: { phonetic: "/rɪˈvjuːɪŋ/", meaning: "审查，回顾" },
  key: { phonetic: "/kiː/", meaning: "关键的，钥匙" },
  traffic: { phonetic: "/ˈtræfɪk/", meaning: "流量，交通" },
  milestones: { phonetic: "/ˈmaɪlˌstoʊnz/", meaning: "里程碑（复数）" },
  milestone: { phonetic: "/ˈmaɪlˌstoʊn/", meaning: "里程碑" },
  achieved: { phonetic: "/əˈtʃiːvd/", meaning: "取得，达成（achieve的过去式）" },
  achieve: { phonetic: "/əˈtʃiːv/", meaning: "取得，达成" },
  organic: { phonetic: "/ɔːrˈɡænɪk/", meaning: "有机的，自然增长的" },
  increased: { phonetic: "/ɪnˈkriːst/", meaning: "增加的（increase的过去式）" },
  increase: { phonetic: "/ɪnˈkriːs/", meaning: "增加，增长" },
  following: { phonetic: "/ˈfɒloʊɪŋ/", meaning: "在...之后，跟随" },
  campaign: { phonetic: "/kæmˈpeɪn/", meaning: "活动，营销战役" },
  overhaul: { phonetic: "/ˈoʊvərˌhɔːl/", meaning: "全面检查，改版" },
  remarkable: { phonetic: "/rɪˈmɑːrkəbəl/", meaning: "卓越的，非凡的" },
  achievement: { phonetic: "/əˈtʃiːvmənt/", meaning: "成就，成绩" },
  short: { phonetic: "/ʃɔːrt/", meaning: "短的，短暂的" },
  timeframe: { phonetic: "/ˈtaɪmfreɪm/", meaning: "时间范围，时间框架" },
  credit: { phonetic: "/ˈkrɛdɪt/", meaning: "归功于，信用" },
  goes: { phonetic: "/ɡoʊz/", meaning: "去，归于（go的第三人称单数）" },
  go: { phonetic: "/ɡoʊ/", meaning: "去，走" },
  content: { phonetic: "/ˈkɒntɛnt/", meaning: "内容，目录" },
  strategy: { phonetic: "/ˈstrætədʒi/", meaning: "策略，战略" },
  robust: { phonetic: "/roʊˈbʌst/", meaning: "强健的，稳健的" },
  keyword: { phonetic: "/ˈkiːwɜːrd/", meaning: "关键词" },
  targeting: { phonetic: "/ˈtɑːrɡɪtɪŋ/", meaning: "定位，目标锁定" },
  target: { phonetic: "/ˈtɑːrɡɪt/", meaning: "目标" },
  agreed: { phonetic: "/əˈɡriːd/", meaning: "同意" },
  agree: { phonetic: "/əˈɡriː/", meaning: "同意" },
  conversion: { phonetic: "/kənˈvɜːrʒən/", meaning: "转化率，转换" },
  landing: { phonetic: "/ˈlændɪŋ/", meaning: "着陆，落地" },
  pages: { phonetic: "/ˈpeɪdʒɪz/", meaning: "页面（复数）" },
  page: { phonetic: "/peɪd/", meaning: "页，页面" },
  rose: { phonetic: "/roʊz/", meaning: "上升，玫瑰（rise的过去式）" },
  rise: { phonetic: "/raɪz/", meaning: "上升，上涨" },
  streamlining: { phonetic: "/ˈstriːmlaɪnɪŋ/", meaning: "精简，优化流程" },
  streamline: { phonetic: "/ˈstriːmlaɪn/", meaning: "精简，使效率更高" },
  checkout: { phonetic: "/ˈtʃɛkaʊt/", meaning: "结账，结账台" },
  reducing: { phonetic: "/rɪˈduːsɪŋ/", meaning: "减少，降低" },
  reduce: { phonetic: "/rɪˈduːs/", meaning: "减少，减小" },
  friction: { phonetic: "/ˈfrɪkʃən/", meaning: "摩擦，阻力" },
  experience: { phonetic: "/ɪkˈspɪəriəns/", meaning: "体验，经验" },
  pays: { phonetic: "/peɪz/", meaning: "回报，支付（pay的第三人称单数）" },
  pay: { phonetic: "/peɪ/", meaning: "支付，付出" },
  budget: { phonetic: "/ˈbʌdʒɪt/", meaning: "预算" },
  allocation: { phonetic: "/ˌæləˈkeɪʃən/", meaning: "分配，配置" },
  allocate: { phonetic: "/ˈæləkeɪt/", meaning: "分配" },
  additional: { phonetic: "/əˈdɪʃənəl/", meaning: "额外的，附加的" },
  funding: { phonetic: "/ˈfʌndɪŋ/", meaning: "资金，拨款" },
  fund: { phonetic: "/fʌnd/", meaning: "基金，资金" },
  social: { phonetic: "/ˈsoʊʃəl/", meaning: "社会的，社交的" },
  media: { phonetic: "/ˈmiːdiə/", meaning: "媒体，媒介" },
  advertising: { phonetic: "/ˈædvərtaɪzɪŋ/", meaning: "广告宣传" },
  advertise: { phonetic: "/ˈædvərtaɪz/", meaning: "做广告" },
  modest: { phonetic: "/ˈmɒdɪst/", meaning: "适度的，谦虚的" },
  scale: { phonetic: "/skeɪl/", meaning: "规模，扩大" },
  campaigns: { phonetic: "/kæmˈpeɪnz/", meaning: "活动，战役（复数）" },
  support: { phonetic: "/səˈpɔːrt/", meaning: "支持" },
  proposal: { phonetic: "/prəˈpoʊzəl/", meaning: "提案，建议" },
  propose: { phonetic: "/prəˈpoʊz/", meaning: "提议" },
  provided: { phonetic: "/prəˈvaɪdɪd/", meaning: "倘若，假若" },
  provide: { phonetic: "/prəˈvaɪd/", meaning: "提供" },
  track: { phonetic: "/træk/", meaning: "追踪，轨道" },
  closely: { phonetic: "/ˈkloʊsli/", meaning: "密切地，仔细地" },
  automated: { phonetic: "/ˈɔːtəmeɪtɪd/", meaning: "自动化的" },
  automate: { phonetic: "/ˈɔːtəmeɪt/", meaning: "使自动化" },
  dashboard: { phonetic: "/ˈdæʃbɔːrd/", meaning: "仪表盘，控制面板" },
  reporting: { phonetic: "/rɪˈpɔːrtɪŋ/", meaning: "报告，汇报" },
  setup: { phonetic: "/ˈsɛtʌp/", meaning: "设置，安装" },
  monitor: { phonetic: "/ˈmɒnɪtər/", meaning: "监控，监视器" },
  daily: { phonetic: "/ˈdeɪli/", meaning: "每日的，日常的" },
  fantastic: { phonetic: "/fænˈtæstɪk/", meaning: "极好的，美妙的" },
  ensure: { phonetic: "/ɪnˈʃʊr/", meaning: "确保，保证" },
  cross: { phonetic: "/krɒs/", meaning: "跨，交叉" },
  departmental: { phonetic: "/ˌdiːpɑːrtˈmɛntəl/", meaning: "部门的，各部门的" },
  alignment: { phonetic: "/əˈlaɪnmənt/", meaning: "对齐，协同一致" },
  align: { phonetic: "/əˈlaɪn/", meaning: "使对齐，联合" },
  maintained: { phonetic: "/meɪnˈteɪnd/", meaning: "保持，维持（maintain的过去式）" },
  maintain: { phonetic: "/meɪnˈteɪn/", meaning: "保持，维系" },
  product: { phonetic: "/ˈprɒdʌkt/", meaning: "产品" },
  sales: { phonetic: "/seɪlz/", meaning: "销售（复数）" },
  sale: { phonetic: "/seɪl/", meaning: "销售，特卖" },
  already: { phonetic: "/ɔːlˈrɛdi/", meaning: "已经" },
  looped: { phonetic: "/luːpt/", meaning: "纳入环中，连结" },
  timeline: { phonetic: "/ˈtaɪmlaɪn/", meaning: "时间线，进度表" },
  risks: { phonetic: "/rɪsks/", meaning: "风险（复数）" },
  risk: { phonetic: "/rɪsk/", meaning: "风险" },
  bottlenecks: { phonetic: "/ˈbɒtəlˌnɛks/", meaning: "瓶颈（复数）" },
  bottleneck: { phonetic: "/ˈbɒtəlˌnɛk/", meaning: "瓶颈" },
  anticipate: { phonetic: "/ænˈtɪsɪpeɪt/", meaning: "预期，预料" },
  server: { phonetic: "/ˈsɜːrvər/", meaning: "服务器" },
  capacity: { phonetic: "/kəˈpæsɪti/", meaning: "容量，承载力" },
  flash: { phonetic: "/flæʃ/", meaning: "闪购，闪现" },
  require: { phonetic: "/rɪˈkwaɪər/", meaning: "需要，要求" },
  minor: { phonetic: "/ˈmaɪnər/", meaning: "较小的，次要的" },
  coordinate: { phonetic: "/koʊˈɔːrdɪneɪt/", meaning: "协调，配合" },
  engineering: { phonetic: "/ˌɛndʒɪˈnɪərɪŋ/", meaning: "工程，工程学" },
  lead: { phonetic: "/liːd/", meaning: "负责人，领导" },
  after: { phonetic: "/ˈæftər/", meaning: "在...之后" },
  prompt: { phonetic: "/prɒmpt/", meaning: "敏捷的，迅速的" },
  action: { phonetic: "/ˈækʃən/", meaning: "行动" },
  infrastructure: { phonetic: "/ˈɪnfrəˌstrʌktʃər/", meaning: "基础设施" },
  preparedness: { phonetic: "/prɪˈpɛrdnəs/", meaning: "准备就绪状态" },
  agenda: { phonetic: "/əˈdʒɛndə/", meaning: "议程，日程" },
  items: { phonetic: "/ˈaɪtəmz/", meaning: "项目，事项（复数）" },
  item: { phonetic: "/ˈaɪtəm/", meaning: "项目，条款" },
  wrap: { phonetic: "/ræp/", meaning: "包裹，结束" },
  reminder: { phonetic: "/rɪˈmaɪndər/", meaning: "提醒，提示" },
  client: { phonetic: "/ˈklaɪənt/", meaning: "客户，委托人" },
  surveys: { phonetic: "/ˈsɜːrveɪz/", meaning: "调查问卷（复数）" },
  survey: { phonetic: "/ˈsɜːrveɪ/", meaning: "调查，民意测验" },
  due: { phonetic: "/duː/", meaning: "到期的，预定的" },
  friday: { phonetic: "/ˈfraɪdeɪ/", meaning: "星期五" },
  monday: { phonetic: "/ˈmʌndeɪ/", meaning: "星期一" },
  tuesday: { phonetic: "/ˈtuːzdeɪ/", meaning: "星期二" },
  wednesday: { phonetic: "/ˈwɛnzdeɪ/", meaning: "星期三" },
  thursday: { phonetic: "/ˈθɜːrzdeɪ/", meaning: "星期四" },
  saturday: { phonetic: "/ˈsætərdeɪ/", meaning: "星期六" },
  sunday: { phonetic: "/ˈsʌndeɪ/", meaning: "星期日" },
  stakeholders: { phonetic: "/ˈsteɪkˌhoʊldərz/", meaning: "利益相关者（复数）" },
  stakeholder: { phonetic: "/ˈsteɪkˌhoʊldər/", meaning: "利益相关者" },
  covers: { phonetic: "/ˈkʌvərz/", meaning: "涵盖，覆盖（cover的第三人称单数）" },
  cover: { phonetic: "/ˈkʌvər/", meaning: "覆盖，涉及" },
  points: { phonetic: "/pɔɪnts/", meaning: "要点，观点（复数）" },
  point: { phonetic: "/pɔɪnt/", meaning: "要点，观点" },
  everyone: { phonetic: "/ˈɛvriˌwʌn/", meaning: "每个人，大家" },
  discussion: { phonetic: "/dɪˈskʌʃən/", meaning: "讨论，商讨" },
  adjourned: { phonetic: "/əˈdʒɜːrnd/", meaning: "休会，闭会（adjourn的过去式）" },
  adjourn: { phonetic: "/əˈdʒɜːrn/", meaning: "休会，延期" },
  rest: { phonetic: "/rɛst/", meaning: "休息，其余" },
  momentum: { phonetic: "/moʊˈmɛntəm/", meaning: "势头，动力" },
  talk: { phonetic: "/tɔːk/", meaning: "交谈，说话" },

  // Additional coverage for all words used in the 40-sentence listening scenes
  again: { phonetic: "/əˈɡɛn/", meaning: "再次，又一次" },
  around: { phonetic: "/əˈraʊnd/", meaning: "在周围；大约" },
  definitely: { phonetic: "/ˈdɛfɪnətli/", meaning: "肯定地，当然" },
  airportfreewifi: { phonetic: "/ˈɛərpɔːrt friː waɪfaɪ/", meaning: "机场免费无线网络" },
  byebye: { phonetic: "/ˌbaɪ ˈbaɪ/", meaning: "拜拜，再见" },
  all: { phonetic: "/ɔːl/", meaning: "所有的，全部" },
  also: { phonetic: "/ˈɔːlsoʊ/", meaning: "也，而且" },
  and: { phonetic: "/ænd/", meaning: "和，与" },
  at: { phonetic: "/æt/", meaning: "在（某处或某时）" },
  available: { phonetic: "/əˈveɪləbəl/", meaning: "可获得的，可用的" },
  b: { phonetic: "/biː/", meaning: "字母B；B号登机口中的字母" },
  bring: { phonetic: "/brɪŋ/", meaning: "带来，携带" },
  busy: { phonetic: "/ˈbɪzi/", meaning: "忙碌的，繁忙的" },
  carryon: { phonetic: "/ˈkæri ɒn/", meaning: "随身携带的；随身行李" },
  converting: { phonetic: "/kənˈvɜːrtɪŋ/", meaning: "转换，转化" },
  crossdepartmental: { phonetic: "/ˌkrɒs ˌdiːpɑːrtˈmɛntəl/", meaning: "跨部门的" },
  discuss: { phonetic: "/dɪˈskʌs/", meaning: "讨论，商讨" },
  during: { phonetic: "/ˈdʊrɪŋ/", meaning: "在……期间" },
  dutyfree: { phonetic: "/ˈdjuːti friː/", meaning: "免税的" },
  execution: { phonetic: "/ˌɛksɪˈkjuːʃən/", meaning: "执行，实施" },
  fine: { phonetic: "/faɪn/", meaning: "好的，没问题；罚款" },
  fi: { phonetic: "/faɪ/", meaning: "无线网络名称中 Wi‑Fi 的后半部分" },
  from: { phonetic: "/frəm/", meaning: "从，来自" },
  help: { phonetic: "/hɛlp/", meaning: "帮助" },
  high: { phonetic: "/haɪ/", meaning: "高的" },
  highconverting: { phonetic: "/haɪ kənˈvɜːrtɪŋ/", meaning: "高转化的" },
  kick: { phonetic: "/kɪk/", meaning: "踢；开始（活动）" },
  hydrated: { phonetic: "/ˈhaɪdreɪtɪd/", meaning: "补充水分的" },
  ill: { phonetic: "/ɪl/", meaning: "生病的，不适的" },
  im: { phonetic: "/aɪm/", meaning: "我是（I'm 的省略形式）" },
  into: { phonetic: "/ˈɪntuː/", meaning: "进入，到……里面" },
  ive: { phonetic: "/aɪv/", meaning: "我已经（I've 的省略形式）" },
  keep: { phonetic: "/kiːp/", meaning: "保持，继续" },
  let: { phonetic: "/lɛt/", meaning: "让，允许" },
  lets: { phonetic: "/lɛts/", meaning: "让我们（let's 的省略形式）" },
  like: { phonetic: "/laɪk/", meaning: "喜欢；像" },
  make: { phonetic: "/meɪk/", meaning: "制作，使得" },
  modern: { phonetic: "/ˈmɒdərn/", meaning: "现代的" },
  now: { phonetic: "/naʊ/", meaning: "现在" },
  of: { phonetic: "/əv/", meaning: "……的；关于" },
  other: { phonetic: "/ˈʌðər/", meaning: "其他的，另一个" },
  off: { phonetic: "/ɒf/", meaning: "离开；开始（活动）" },
  quarter: { phonetic: "/ˈkwɔːrtər/", meaning: "四分之一；季度" },
  quite: { phonetic: "/kwaɪt/", meaning: "相当，十分" },
  quick: { phonetic: "/kwɪk/", meaning: "快的，迅速的" },
  rates: { phonetic: "/reɪts/", meaning: "比率，汇率（复数）" },
  remember: { phonetic: "/rɪˈmɛmbər/", meaning: "记得，记住" },
  roi: { phonetic: "/ˌɑːr oʊ ˈaɪ/", meaning: "投资回报率（ROI）" },
  scaling: { phonetic: "/ˈskeɪlɪŋ/", meaning: "扩大规模，扩展" },
  see: { phonetic: "/siː/", meaning: "看见，见到" },
  seo: { phonetic: "/ˌɛs iː ˈoʊ/", meaning: "搜索引擎优化（SEO）" },
  set: { phonetic: "/sɛt/", meaning: "设置，安排" },
  slack: { phonetic: "/slæk/", meaning: "Slack（团队协作工具）" },
  soon: { phonetic: "/suːn/", meaning: "很快，不久" },
  space: { phonetic: "/speɪs/", meaning: "空间，位置" },
  sync: { phonetic: "/sɪŋk/", meaning: "同步" },
  such: { phonetic: "/sʌtʃ/", meaning: "这样的，如此的" },
  there: { phonetic: "/ðɛər/", meaning: "那里；有（there is 的结构中）" },
  though: { phonetic: "/ðoʊ/", meaning: "虽然；不过" },
  throughout: { phonetic: "/θruːˈaʊt/", meaning: "遍及，自始至终" },
  wifi: { phonetic: "/ˈwaɪfaɪ/", meaning: "无线网络，Wi‑Fi" },
  to: { phonetic: "/tuː/", meaning: "向，给；去做某事" },
  ua: { phonetic: "/ˌjuː ˈeɪ/", meaning: "航空公司代码 UA" },
  up: { phonetic: "/ʌp/", meaning: "向上；结束或完成" },
  wi: { phonetic: "/waɪ/", meaning: "无线网络名称中 Wi‑Fi 的前半部分" },
  with: { phonetic: "/wɪð/", meaning: "和，与；带着" },
  wont: { phonetic: "/woʊnt/", meaning: "不会（won't 的省略形式）" },
  workday: { phonetic: "/ˈwɜːrkdeɪ/", meaning: "工作日" },
  youll: { phonetic: "/juːl/", meaning: "你将会（you'll 的省略形式）" },
  youre: { phonetic: "/jʊər/", meaning: "你是（you're 的省略形式）" },
  academic: { phonetic: "/ˌækəˈdɛmɪk/", meaning: "学业的，学术的" },
  access: { phonetic: "/ˈæksɛs/", meaning: "访问，使用权" },
  account: { phonetic: "/əˈkaʊnt/", meaning: "账户" },
  accounts: { phonetic: "/əˈkaʊnts/", meaning: "账户（复数）" },
  activate: { phonetic: "/ˈæktɪveɪt/", meaning: "激活，启用" },
  activation: { phonetic: "/ˌæktɪˈveɪʃən/", meaning: "激活，启用" },
  activities: { phonetic: "/ækˈtɪvətiz/", meaning: "活动（复数）" },
  add: { phonetic: "/æd/", meaning: "添加，增加" },
  advance: { phonetic: "/ədˈvæns/", meaning: "提前；推进" },
  afterschool: { phonetic: "/ˈæftər skuːl/", meaning: "课后的" },
  aisle: { phonetic: "/aɪl/", meaning: "过道" },
  allowed: { phonetic: "/əˈlaʊd/", meaning: "被允许的" },
  alright: { phonetic: "/ɔːlˈraɪt/", meaning: "好的，没问题" },
  antibiotics: { phonetic: "/ˌæntibaɪˈɑːtɪks/", meaning: "抗生素" },
  anytime: { phonetic: "/ˈɛniˌtaɪm/", meaning: "随时；不用客气" },
  apartment: { phonetic: "/əˈpɑːrtmənt/", meaning: "公寓" },
  app: { phonetic: "/æp/", meaning: "应用程序" },
  apple: { phonetic: "/ˈæpəl/", meaning: "苹果" },
  appointment: { phonetic: "/əˈpɔɪntmənt/", meaning: "预约" },
  assigned: { phonetic: "/əˈsaɪnd/", meaning: "指定的；分配的" },
  average: { phonetic: "/ˈævərɪdʒ/", meaning: "平均的；平均值" },
  awesome: { phonetic: "/ˈɔːsəm/", meaning: "极好的，棒极了" },
  back: { phonetic: "/bæk/", meaning: "背面；返回" },
  balance: { phonetic: "/ˈbæləns/", meaning: "余额；平衡" },
  bank: { phonetic: "/bæŋk/", meaning: "银行" },
  banking: { phonetic: "/ˈbæŋkɪŋ/", meaning: "银行业务" },
  below: { phonetic: "/bɪˈloʊ/", meaning: "在下面" },
  better: { phonetic: "/ˈbɛtər/", meaning: "更好的；更好地" },
  between: { phonetic: "/bɪˈtwiːn/", meaning: "在两者之间" },
  blue: { phonetic: "/bluː/", meaning: "蓝色的；蓝十字保险中的蓝" },
  both: { phonetic: "/boʊθ/", meaning: "两者都" },
  bottles: { phonetic: "/ˈbɑːtəlz/", meaning: "瓶子（复数）" },
  bound: { phonetic: "/baʊnd/", meaning: "前往……的" },
  brand: { phonetic: "/brænd/", meaning: "品牌" },
  break: { phonetic: "/breɪk/", meaning: "休息；假期" },
  building: { phonetic: "/ˈbɪldɪŋ/", meaning: "大楼，建筑物" },
  buses: { phonetic: "/ˈbʌsɪz/", meaning: "公交车（复数）" },
  business: { phonetic: "/ˈbɪznəs/", meaning: "商务；业务" },
  but: { phonetic: "/bət/", meaning: "但是" },
  buy: { phonetic: "/baɪ/", meaning: "购买" },
  california: { phonetic: "/ˌkælɪˈfɔːrnjə/", meaning: "加利福尼亚州" },
  calling: { phonetic: "/ˈkɔːlɪŋ/", meaning: "打电话；呼叫" },
  car: { phonetic: "/kɑːr/", meaning: "汽车" },
  card: { phonetic: "/kɑːrd/", meaning: "卡片；银行卡" },
  cards: { phonetic: "/kɑːrdz/", meaning: "卡片（复数）" },
  cash: { phonetic: "/kæʃ/", meaning: "现金" },
  cat: { phonetic: "/kæt/", meaning: "猫" },
  cats: { phonetic: "/kæts/", meaning: "猫（复数）" },
  child: { phonetic: "/tʃaɪld/", meaning: "孩子" },
  childs: { phonetic: "/tʃaɪldz/", meaning: "孩子的（child's 去掉撇号）" },
  clinic: { phonetic: "/ˈklɪnɪk/", meaning: "诊所" },
  close: { phonetic: "/kloʊz/", meaning: "关闭；接近" },
  clubs: { phonetic: "/klʌbz/", meaning: "社团（复数）" },
  code: { phonetic: "/koʊd/", meaning: "代码；编码" },
  collect: { phonetic: "/kəˈlɛkt/", meaning: "领取；收集" },
  commute: { phonetic: "/kəˈmjuːt/", meaning: "通勤" },
  complete: { phonetic: "/kəmˈpliːt/", meaning: "完成；完整的" },
  comprehension: { phonetic: "/ˌkɑːmprɪˈhɛnʃən/", meaning: "理解，理解力" },
  conference: { phonetic: "/ˈkɑːnfərəns/", meaning: "会议；面谈" },
  confirmation: { phonetic: "/ˌkɑːnfərˈmeɪʃən/", meaning: "确认" },
  contactless: { phonetic: "/ˈkɑːntæktləs/", meaning: "非接触式的" },
  contains: { phonetic: "/kənˈteɪnz/", meaning: "包含" },
  cough: { phonetic: "/kɔːf/", meaning: "咳嗽" },
  course: { phonetic: "/kɔːrs/", meaning: "课程；过程" },
  dairy: { phonetic: "/ˈdɛəri/", meaning: "乳制品；乳制品区" },
  deal: { phonetic: "/diːl/", meaning: "交易；划算的优惠" },
  debit: { phonetic: "/ˈdɛbɪt/", meaning: "借记；借记卡" },
  dedication: { phonetic: "/ˌdɛdɪˈkeɪʃən/", meaning: "奉献，投入" },
  deposit: { phonetic: "/dɪˈpɑːzɪt/", meaning: "存款；存入" },
  details: { phonetic: "/ˈdiːteɪlz/", meaning: "细节（复数）" },
  difference: { phonetic: "/ˈdɪfərəns/", meaning: "区别；差异" },
  doctor: { phonetic: "/ˈdɑːktər/", meaning: "医生" },
  documents: { phonetic: "/ˈdɑːkjəmənts/", meaning: "文件（复数）" },
  dogs: { phonetic: "/dɔːɡz/", meaning: "狗（复数）" },
  dollars: { phonetic: "/ˈdɑːlərz/", meaning: "美元（复数）" },
  done: { phonetic: "/dʌn/", meaning: "完成的；做完" },
  download: { phonetic: "/ˈdaʊnloʊd/", meaning: "下载" },
  downloaded: { phonetic: "/ˌdaʊnˈloʊdɪd/", meaning: "已下载的" },
  dr: { phonetic: "/ˈdɑːktər/", meaning: "医生的缩写" },
  drivers: { phonetic: "/ˈdraɪvərz/", meaning: "驾驶员（复数）；驾照中的驾驶者" },
  eighteen: { phonetic: "/ˌeɪˈtiːn/", meaning: "十八" },
  electricity: { phonetic: "/ɪˌlɛkˈtrɪsəti/", meaning: "电；电费" },
  else: { phonetic: "/ɛls/", meaning: "其他的；此外" },
  encouraged: { phonetic: "/ɪnˈkɜːrɪdʒd/", meaning: "被鼓励的" },
  endorse: { phonetic: "/ɪnˈdɔːrs/", meaning: "背书；签名确认" },
  entered: { phonetic: "/ˈɛntərd/", meaning: "已输入；进入了" },
  every: { phonetic: "/ˈɛvəri/", meaning: "每一个" },
  experiencing: { phonetic: "/ɪkˈspɪəriənsɪŋ/", meaning: "正在经历" },
  extra: { phonetic: "/ˈɛkstrə/", meaning: "额外的" },
  fee: { phonetic: "/fiː/", meaning: "费用" },
  feel: { phonetic: "/fiːl/", meaning: "感觉" },
  fever: { phonetic: "/ˈfiːvər/", meaning: "发烧；发热" },
  few: { phonetic: "/fjuː/", meaning: "少数的；几个" },
  fifteen: { phonetic: "/ˌfɪfˈtiːn/", meaning: "十五" },
  fifty: { phonetic: "/ˈfɪfti/", meaning: "五十" },
  focus: { phonetic: "/ˈfoʊkəs/", meaning: "重点；专注" },
  forward: { phonetic: "/ˈfɔːrwərd/", meaning: "向前；转发" },
  four: { phonetic: "/fɔːr/", meaning: "四" },
  fourteen: { phonetic: "/ˌfɔːrˈtiːn/", meaning: "十四" },
  garage: { phonetic: "/ɡəˈrɑːʒ/", meaning: "车库" },
  gives: { phonetic: "/ɡɪvz/", meaning: "给出（give 的第三人称）" },
  glad: { phonetic: "/ɡlæd/", meaning: "高兴的" },
  groceries: { phonetic: "/ˈɡroʊsəriz/", meaning: "食品杂货" },
  guidance: { phonetic: "/ˈɡaɪdəns/", meaning: "指导" },
  happy: { phonetic: "/ˈhæpi/", meaning: "开心的" },
  health: { phonetic: "/hɛlθ/", meaning: "健康" },
  hear: { phonetic: "/hɪr/", meaning: "听见" },
  helpful: { phonetic: "/ˈhɛlpfəl/", meaning: "有帮助的" },
  home: { phonetic: "/hoʊm/", meaning: "家；在家" },
  how: { phonetic: "/haʊ/", meaning: "如何；怎样" },
  hundred: { phonetic: "/ˈhʌndrəd/", meaning: "一百" },
  hydration: { phonetic: "/haɪˈdreɪʃən/", meaning: "补水；水分补充" },
  id: { phonetic: "/aɪˈdiː/", meaning: "身份证明（ID）" },
  immediately: { phonetic: "/ɪˈmiːdiətli/", meaning: "立即" },
  important: { phonetic: "/ɪmˈpɔːrtənt/", meaning: "重要的" },
  improving: { phonetic: "/ɪmˈpruːvɪŋ/", meaning: "正在改进" },
  included: { phonetic: "/ɪnˈkluːdɪd/", meaning: "包含在内的" },
  including: { phonetic: "/ɪnˈkluːdɪŋ/", meaning: "包括" },
  infection: { phonetic: "/ɪnˈfɛkʃən/", meaning: "感染" },
  initial: { phonetic: "/ɪˈnɪʃəl/", meaning: "最初的；初始的" },
  insert: { phonetic: "/ɪnˈsɜːrt/", meaning: "插入" },
  instructions: { phonetic: "/ɪnˈstrʌkʃənz/", meaning: "说明；指示" },
  insurance: { phonetic: "/ɪnˈʃʊrəns/", meaning: "保险" },
  intake: { phonetic: "/ˈɪnteɪk/", meaning: "接收；初诊登记" },
  interactive: { phonetic: "/ˌɪntərˈæktɪv/", meaning: "互动的" },
  issue: { phonetic: "/ˈɪʃuː/", meaning: "问题；签发" },
  keypad: { phonetic: "/ˈkiːpæd/", meaning: "键盘" },
  label: { phonetic: "/ˈleɪbəl/", meaning: "标签" },
  lease: { phonetic: "/liːs/", meaning: "租约" },
  license: { phonetic: "/ˈlaɪsəns/", meaning: "许可证；驾照" },
  linked: { phonetic: "/lɪŋkt/", meaning: "已关联的" },
  listing: { phonetic: "/ˈlɪstɪŋ/", meaning: "房源；列表" },
  little: { phonetic: "/ˈlɪtəl/", meaning: "少量的；小的" },
  load: { phonetic: "/loʊd/", meaning: "装载；充值" },
  local: { phonetic: "/ˈloʊkəl/", meaning: "当地的" },
  logging: { phonetic: "/ˈlɔːɡɪŋ/", meaning: "登录；记录" },
  login: { phonetic: "/ˈlɔːɡɪn/", meaning: "登录" },
  lot: { phonetic: "/lɑːt/", meaning: "停车场；许多" },
  lower: { phonetic: "/ˈloʊər/", meaning: "较低的；下层的" },
  machine: { phonetic: "/məˈʃiːn/", meaning: "机器" },
  mail: { phonetic: "/meɪl/", meaning: "邮件；邮寄" },
  manageable: { phonetic: "/ˈmænɪdʒəbəl/", meaning: "可处理的" },
  math: { phonetic: "/mæθ/", meaning: "数学" },
  medicine: { phonetic: "/ˈmɛdɪsən/", meaning: "药物" },
  message: { phonetic: "/ˈmɛsɪdʒ/", meaning: "消息；短信" },
  metro: { phonetic: "/ˈmɛtroʊ/", meaning: "地铁" },
  mild: { phonetic: "/maɪld/", meaning: "轻微的" },
  minimum: { phonetic: "/ˈmɪnɪməm/", meaning: "最低限度；最低的" },
  minutes: { phonetic: "/ˈmɪnɪts/", meaning: "分钟（复数）" },
  mobile: { phonetic: "/ˈmoʊbəl/", meaning: "移动的；手机的" },
  month: { phonetic: "/mʌnθ/", meaning: "月" },
  monthly: { phonetic: "/ˈmʌnθli/", meaning: "每月的" },
  months: { phonetic: "/mʌnθs/", meaning: "月份（复数）" },
  oclock: { phonetic: "/əˈklɑːk/", meaning: "……点钟" },
  oil: { phonetic: "/ɔɪl/", meaning: "油" },
  olive: { phonetic: "/ˈɑːlɪv/", meaning: "橄榄" },
  one: { phonetic: "/wʌn/", meaning: "一；一个" },
  onto: { phonetic: "/ˈɑːntuː/", meaning: "到……上" },
  open: { phonetic: "/ˈoʊpən/", meaning: "打开；空缺的" },
  opening: { phonetic: "/ˈoʊpənɪŋ/", meaning: "空缺；开放" },
  option: { phonetic: "/ˈɑːpʃən/", meaning: "选项" },
  over: { phonetic: "/ˈoʊvər/", meaning: "在……上方；超过" },
  overthecounter: { phonetic: "/ˌoʊvər ðə ˈkaʊntər/", meaning: "非处方的" },
  own: { phonetic: "/oʊn/", meaning: "自己的；拥有" },
  package: { phonetic: "/ˈpækɪdʒ/", meaning: "包裹" },
  paid: { phonetic: "/peɪd/", meaning: "已支付的" },
  paper: { phonetic: "/ˈpeɪpər/", meaning: "纸；纸张" },
  paperwork: { phonetic: "/ˈpeɪpərwɜːrk/", meaning: "文件；表格手续" },
  parent: { phonetic: "/ˈpɛrənt/", meaning: "家长" },
  parents: { phonetic: "/ˈpɛrənts/", meaning: "家长们" },
  parking: { phonetic: "/ˈpɑːrkɪŋ/", meaning: "停车；停车位" },
  partnering: { phonetic: "/ˈpɑːrtnərɪŋ/", meaning: "合作" },
  passcode: { phonetic: "/ˈpæskoʊd/", meaning: "密码" },
  patient: { phonetic: "/ˈpeɪʃənt/", meaning: "病人；有耐心的" },
  payment: { phonetic: "/ˈpeɪmənt/", meaning: "付款" },
  perfect: { phonetic: "/ˈpɜːrfɪkt/", meaning: "完美的" },
  perfectly: { phonetic: "/ˈpɜːrfɪktli/", meaning: "完美地；完全合适地" },
  permanent: { phonetic: "/ˈpɜːrmənənt/", meaning: "永久的；正式的" },
  persistent: { phonetic: "/pərˈsɪstənt/", meaning: "持续的" },
  pets: { phonetic: "/pɛts/", meaning: "宠物（复数）" },
  phone: { phonetic: "/foʊn/", meaning: "电话；手机" },
  photo: { phonetic: "/ˈfoʊtoʊ/", meaning: "照片" },
  place: { phonetic: "/pleɪs/", meaning: "放置；地方" },
  platform: { phonetic: "/ˈplætfɔːrm/", meaning: "平台；站台" },
  pleasure: { phonetic: "/ˈplɛʒər/", meaning: "荣幸；愉快" },
  portal: { phonetic: "/ˈpɔːrtəl/", meaning: "门户网站" },
  postage: { phonetic: "/ˈpoʊstɪdʒ/", meaning: "邮费" },
  practice: { phonetic: "/ˈpræktɪs/", meaning: "练习" },
  primary: { phonetic: "/ˈpraɪmɛri/", meaning: "主要的；全科的" },
  priority: { phonetic: "/praɪˈɔːrəti/", meaning: "优先；优先级" },
  problemsolving: { phonetic: "/ˈprɑːbləm ˌsɑːlvɪŋ/", meaning: "解决问题" },
  process: { phonetic: "/ˈprɑːsɛs/", meaning: "处理；过程" },
  professional: { phonetic: "/prəˈfɛʃənəl/", meaning: "专业的；专业人士" },
  progress: { phonetic: "/ˈprɑːɡrɛs/", meaning: "进展" },
  purchase: { phonetic: "/ˈpɜːrtʃəs/", meaning: "购买" },
  qr: { phonetic: "/ˌkjuː ˈɑːr/", meaning: "二维码（QR）" },
  rear: { phonetic: "/rɪr/", meaning: "后方；后面的" },
  reasonable: { phonetic: "/ˈriːzənəbəl/", meaning: "合理的" },
  receipt: { phonetic: "/rɪˈsiːt/", meaning: "收据" },
  receive: { phonetic: "/rɪˈsiːv/", meaning: "收到" },
  received: { phonetic: "/rɪˈsiːvd/", meaning: "已收到的" },
  recommend: { phonetic: "/ˌrɛkəˈmɛnd/", meaning: "推荐" },
  recovery: { phonetic: "/rɪˈkʌvəri/", meaning: "康复；恢复" },
  register: { phonetic: "/ˈrɛdʒɪstər/", meaning: "登记；收银机" },
  registers: { phonetic: "/ˈrɛdʒɪstərz/", meaning: "收银机（复数）" },
  reloadable: { phonetic: "/ˌriːˈloʊdəbəl/", meaning: "可充值的" },
  renew: { phonetic: "/rɪˈnuː/", meaning: "续约；更新" },
  rent: { phonetic: "/rɛnt/", meaning: "租金；租用" },
  required: { phonetic: "/rɪˈkwaɪərd/", meaning: "必需的；要求的" },
  resources: { phonetic: "/rɪˈsɔːrsɪz/", meaning: "资源（复数）" },
  respiratory: { phonetic: "/ˈrɛspərətɔːri/", meaning: "呼吸的" },
  reusable: { phonetic: "/ˌriːˈjuːzəbəl/", meaning: "可重复使用的" },
  rewards: { phonetic: "/rɪˈwɔːrdz/", meaning: "奖励；会员优惠" },
  riders: { phonetic: "/ˈraɪdərz/", meaning: "乘客（复数）" },
  savings: { phonetic: "/ˈseɪvɪŋz/", meaning: "储蓄" },
  scan: { phonetic: "/skæn/", meaning: "扫描" },
  school: { phonetic: "/skuːl/", meaning: "学校" },
  second: { phonetic: "/ˈsɛkənd/", meaning: "第二；秒" },
  section: { phonetic: "/ˈsɛkʃən/", meaning: "区域；部分" },
  select: { phonetic: "/sɪˈlɛkt/", meaning: "选择" },
  selfcheckout: { phonetic: "/ˌsɛlf ˈtʃɛkaʊt/", meaning: "自助结账" },
  sell: { phonetic: "/sɛl/", meaning: "售卖" },
  semester: { phonetic: "/sɪˈmɛstər/", meaning: "学期" },
  send: { phonetic: "/sɛnd/", meaning: "发送" },
  separate: { phonetic: "/ˈsɛpərət/", meaning: "分开的；另计的" },
  seventeen: { phonetic: "/ˌsɛvənˈtiːn/", meaning: "十七" },
  several: { phonetic: "/ˈsɛvərəl/", meaning: "几个；若干" },
  shopping: { phonetic: "/ˈʃɑːpɪŋ/", meaning: "购物" },
  showing: { phonetic: "/ˈʃoʊɪŋ/", meaning: "展示；带看" },
  signature: { phonetic: "/ˈsɪɡnətʃər/", meaning: "签名" },
  six: { phonetic: "/sɪks/", meaning: "六" },
  small: { phonetic: "/smɔːl/", meaning: "小的" },
  smith: { phonetic: "/smɪθ/", meaning: "史密斯（姓氏）" },
  smooth: { phonetic: "/smuːð/", meaning: "顺利的；平稳的" },
  sore: { phonetic: "/sɔːr/", meaning: "疼痛的" },
  specific: { phonetic: "/spəˈsɪfɪk/", meaning: "具体的" },
  speedy: { phonetic: "/ˈspiːdi/", meaning: "快速的" },
  spring: { phonetic: "/sprɪŋ/", meaning: "春季；弹簧" },
  standard: { phonetic: "/ˈstændərd/", meaning: "标准的" },
  still: { phonetic: "/stɪl/", meaning: "仍然；还" },
  store: { phonetic: "/stɔːr/", meaning: "商店" },
  strong: { phonetic: "/strɔːŋ/", meaning: "强的；擅长的" },
  students: { phonetic: "/ˈstuːdənts/", meaning: "学生（复数）" },
  subjects: { phonetic: "/ˈsʌbdʒɪkts/", meaning: "科目；主题（复数）" },
  successfully: { phonetic: "/səkˈsɛsfəli/", meaning: "成功地" },
  suits: { phonetic: "/suːts/", meaning: "适合（suit 的第三人称）" },
  symptoms: { phonetic: "/ˈsɪmptəmz/", meaning: "症状（复数）" },
  tap: { phonetic: "/tæp/", meaning: "轻触；感应支付" },
  taptopay: { phonetic: "/ˌtæp tə ˈpeɪ/", meaning: "感应支付" },
  tell: { phonetic: "/tɛl/", meaning: "告诉" },
  temperature: { phonetic: "/ˈtɛmprətʃər/", meaning: "温度" },
  temporary: { phonetic: "/ˈtɛmpərɛri/", meaning: "临时的" },
  ten: { phonetic: "/tɛn/", meaning: "十" },
  text: { phonetic: "/tɛkst/", meaning: "短信；文本" },
  three: { phonetic: "/θriː/", meaning: "三" },
  throat: { phonetic: "/θroʊt/", meaning: "喉咙" },
  ticket: { phonetic: "/ˈtɪkɪt/", meaning: "票；登机牌" },
  time: { phonetic: "/taɪm/", meaning: "时间" },
  tomorrow: { phonetic: "/təˈmɑːroʊ/", meaning: "明天" },
  total: { phonetic: "/ˈtoʊtəl/", meaning: "总计；总数" },
  trains: { phonetic: "/treɪnz/", meaning: "火车（复数）" },
  transfers: { phonetic: "/trænsˈfɜːrz/", meaning: "换乘；转账（复数）" },
  transit: { phonetic: "/ˈtrænzɪt/", meaning: "公共交通" },
  twelve: { phonetic: "/twɛlv/", meaning: "十二" },
  twenty: { phonetic: "/ˈtwɛnti/", meaning: "二十" },
  twobedroom: { phonetic: "/ˌtuː ˈbɛdruːm/", meaning: "两居室的" },
  typically: { phonetic: "/ˈtɪpɪkəli/", meaning: "通常" },
  unit: { phonetic: "/ˈjuːnɪt/", meaning: "单元；房屋" },
  upcoming: { phonetic: "/ˈʌpkʌmɪŋ/", meaning: "即将到来的" },
  use: { phonetic: "/juːz/", meaning: "使用" },
  utilities: { phonetic: "/juːˈtɪlətiz/", meaning: "公用事业费（水电等）" },
  valid: { phonetic: "/ˈvælɪd/", meaning: "有效的" },
  validation: { phonetic: "/ˌvælɪˈdeɪʃən/", meaning: "验证；确认" },
  vegetables: { phonetic: "/ˈvɛdʒtəbəlz/", meaning: "蔬菜（复数）" },
  verification: { phonetic: "/ˌvɛrɪfɪˈkeɪʃən/", meaning: "验证" },
  via: { phonetic: "/ˈvaɪə/", meaning: "通过；经由" },
  viewing: { phonetic: "/ˈvjuːɪŋ/", meaning: "查看；看房" },
  waive: { phonetic: "/weɪv/", meaning: "免除" },
  water: { phonetic: "/ˈwɔːtər/", meaning: "水；水费" },
  within: { phonetic: "/wɪˈðɪn/", meaning: "在……之内" },
  year: { phonetic: "/jɪr/", meaning: "年" },
};

// Simple lemmatizer / word stemmer helper for better dictionary matching
const lookupWord = (rawWord: string) => {
  const clean = rawWord.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (!clean) return null;

  // Exact match
  if (DICTIONARY[clean]) {
    return { word: clean, ...DICTIONARY[clean] };
  }

  // Common suffix stripping (plural -s/-es, past tense -ed, progressive -ing, third person -s)
  const suffixes = ["ies", "es", "s", "ed", "ing", "ly", "er", "est"];
  for (const suffix of suffixes) {
    if (clean.endsWith(suffix) && clean.length - suffix.length >= 2) {
      const base = clean.slice(0, clean.length - suffix.length);
      if (DICTIONARY[base]) {
        const baseEntry = DICTIONARY[base];
        return {
          word: clean,
          phonetic: baseEntry.phonetic,
          meaning: `${baseEntry.meaning}（${clean}的变形）`,
        };
      }
      // Check double consonant drop (e.g. stopped -> stop)
      if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
        const singleConsonantBase = base.slice(0, base.length - 1);
        if (DICTIONARY[singleConsonantBase]) {
          const entry = DICTIONARY[singleConsonantBase];
          return {
            word: clean,
            phonetic: entry.phonetic,
            meaning: `${entry.meaning}（${clean}的变形）`,
          };
        }
      }
    }
  }

  // Intelligent fallback for unrecognized or specialized words
  return {
    word: clean,
    phonetic: `/${clean.length > 8 ? clean.slice(0, 3) + "..." + clean.slice(-3) : clean}/`,
    meaning: `${clean}（英语实用词汇）`,
  };
};

interface InteractiveSentenceProps {
  text: string;
  speechRate?: number;
  onVocabChange?: () => void;
}

export const InteractiveSentence: React.FC<InteractiveSentenceProps> = ({ text, speechRate = 1, onVocabChange }) => {
  const [activePopup, setActivePopup] = useState<{ word: string; phonetic: string; meaning: string } | null>(null);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setSavedWords(loadSavedWords());
  }, []);

  // 10 seconds auto-dismiss timer
  useEffect(() => {
    if (activePopup) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setActivePopup(null);
      }, 10000);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [activePopup]);

  const words = text.split(/(\s+)/);

  const handleWordClick = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const info = lookupWord(token);
    if (!info) return;

    setActivePopup(info);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(info.word);
      utterance.rate = speechRate;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const playWordAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = speechRate;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const isWordSaved = (word: string) => {
    return savedWords.some((item) => item.word.toLowerCase() === word.toLowerCase());
  };

  const toggleSaveWord = (wordObj: { word: string; phonetic: string; meaning: string }) => {
    const current = loadSavedWords();
    const exists = current.some((item) => item.word.toLowerCase() === wordObj.word.toLowerCase());
    let updated: SavedWord[];
    if (exists) {
      updated = current.filter((item) => item.word.toLowerCase() !== wordObj.word.toLowerCase());
    } else {
      updated = [{ ...wordObj, sentence: text, savedAt: Date.now() }, ...current];
    }
    saveWordsToStorage(updated);
    setSavedWords(updated);
    if (onVocabChange) onVocabChange();
  };

  return (
    <span className="relative inline-block leading-relaxed">
      {words.map((token, index) => {
        const isWord = /[a-zA-Z]/.test(token);
        if (!isWord) {
          return <span key={index}>{token}</span>;
        }
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              handleWordClick(token, e);
            }}
            className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 px-0.5 rounded transition-colors inline-block"
            title="点击查看单词音标与释义"
          >
            {token}
          </span>
        );
      })}

      {activePopup && (
        <span
          className="absolute z-30 left-0 bottom-full mb-2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl flex items-center gap-3 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-blue-300 capitalize">{activePopup.word}</span>
              <span className="text-slate-400 font-mono text-[11px]">{activePopup.phonetic}</span>
              <button
                onClick={() => playWordAudio(activePopup.word)}
                className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                title="朗读单词"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleSaveWord(activePopup)}
                className={`p-1 rounded transition-colors flex items-center gap-1 ${
                  isWordSaved(activePopup.word) ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                }`}
                title={isWordSaved(activePopup.word) ? "移出生词本" : "加入生词本"}
              >
                {isWordSaved(activePopup.word) ? <BookMarked className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-slate-200 mt-1">{activePopup.meaning}</span>
          </div>
          <button
            onClick={() => setActivePopup(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded ml-1"
            title="关闭卡片"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}
    </span>
  );
};

interface VocabNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  speechRate?: number;
  onVocabChange?: () => void;
  onWordRemoved?: () => void;
}

export const VocabNotebookModal: React.FC<VocabNotebookModalProps> = ({ isOpen, onClose, speechRate = 1, onVocabChange, onWordRemoved }) => {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSavedWords(loadSavedWords());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = (word: string) => {
    const current = loadSavedWords();
    const updated = current.filter((item) => item.word.toLowerCase() !== word.toLowerCase());
    saveWordsToStorage(updated);
    setSavedWords(updated);
    if (onVocabChange) onVocabChange();
    if (onWordRemoved) onWordRemoved();
  };

  const playWord = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = speechRate;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vocabulary Notebook</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">我的生词本 ({savedWords.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          {savedWords.length === 0 ? (
            <div className="py-16 text-center">
              <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">生词本还是空的</p>
              <p className="text-xs text-slate-400 mt-1">在任意英文句子中点击单词即可加入生词本。</p>
            </div>
          ) : (
            savedWords.map((item) => (
              <div key={item.word} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <span className="font-bold text-base text-slate-900 capitalize">{item.word}</span>
                  <span className="text-xs text-slate-500 font-mono">{item.phonetic}</span>
                  <button
                    onClick={() => playWord(item.word)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="朗读单词"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-700 font-medium">{item.meaning}</p>
                {item.sentence && (
                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                    <span className="font-semibold text-slate-600 mr-1.5">原句语境:</span>
                    <span className="italic text-slate-600">"{item.sentence}"</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
