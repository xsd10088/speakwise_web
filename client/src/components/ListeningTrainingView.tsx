import React, { useState, useEffect, useRef } from "react";
import { Volume2, Play, Pause, BookOpen, Sparkles, Languages, Headphones } from "lucide-react";
import { InteractiveSentence } from "./InteractiveSentence";

export type ListeningLine = {
  id: number;
  speaker: string;
  text: string;
  translation: string;
  note: string;
};

export type ListeningScene = {
  id: string;
  title: string;
  description: string;
  lines: ListeningLine[];
};

export const LISTENING_SPEEDS = [0.75, 1, 1.25] as const;

const generate40Lines = (sceneType: string): ListeningLine[] => {
  let rawPairs: string[][] = [];
  if (sceneType === "greetings") {
    rawPairs = [
      ["Alex", "Good morning! Did you sleep well last night?", "早上好！昨晚睡得好吗？", "用 'sleep well' 询问对方睡眠质量，是日常问候的温馨开场。"],
      ["Mia", "Morning, Alex! Yes, I did, though I stayed up a bit late reading.", "早啊，亚历克斯！是的，睡得不错，不过我读书稍微熬夜了一会儿。", "用 'stayed up a bit late' 表达熬夜，语气自然。"],
      ["Alex", "What kind of book were you reading? Anything interesting?", "你在读什么书？有什么有意思的内容吗？", "用 'What kind of book' 询问书籍类别，开启共同话题。"],
      ["Mia", "It's a novel about modern art history. Quite fascinating actually.", "是一本关于现代艺术史的小说。其实挺引人入胜的。", "实用短语 'Quite fascinating' 增强赞叹的语气。"],
      ["Alex", "I've always found art history inspiring. Do you visit galleries often?", "我一直觉得艺术史很启发灵感。你经常去参观画廊吗？", "用 'inspiring' 表达对艺术的启发感。"],
      ["Mia", "Whenever I have a free weekend, I try to check out a new exhibition.", "每逢周末有空，我都尽量去看看新的展览。", "用 'Whenever' 表示每当……的时候，表达习惯。"],
      ["Alex", "That sounds like a wonderful habit. By the way, are you heading to work now?", "听起来是个很棒的习惯。对了，你现在正要去上班吗？", "用 'By the way' 转换话题过渡到当前行程。"],
      ["Mia", "Yes, taking the subway. It's usually quite busy at this hour.", "对，坐地铁去。这个点人通常挺多的。", "用 'quite busy' 形容早高峰拥挤。"],
      ["Alex", "True. Have you had your breakfast yet, or are you grabbing coffee on the way?", "确实。你吃过早餐了吗，还是在路上买咖啡？", "用 'grabbing coffee' 表达顺便买咖啡。"],
      ["Mia", "I grabbed a quick pastry and a latte near the station.", "我在车站附近匆忙买了个糕点和拿铁。", "用 'grabbed a quick' 形容快捷简便的饮食。"],
      ["Alex", "That works. What are your main tasks scheduled for today?", "那挺好。你今天安排的主要工作任务是什么？", "用 'scheduled for today' 询问日程安排。"],
      ["Mia", "I need to finalize a quarterly design report and review team feedback.", "我需要完成一份季度设计报告并审核团队反馈。", "用 'finalize' 表示最后定稿。"],
      ["Alex", "Sounds like a productive morning ahead. Good luck with that!", "听起来上午会很充实。祝你一切顺利！", "罗列祝愿的常用表达 'Good luck with that!'。"],
      ["Mia", "Thanks, Alex! What about your schedule? Working remotely today?", "谢谢，亚历克斯！你今天日程呢？今天在家远程办公吗？", "用 'Working remotely' 询问是否居家办公。"],
      ["Alex", "No, I'm at the office today. We have a brainstorming session this afternoon.", "不，我今天在办公室。我们下午有一场头脑风暴会。", "用 'brainstorming session' 表达头脑风暴会议。"],
      ["Mia", "Ah, team collaboration is always energetic. Hope you get great ideas.", "啊，团队协作总是充满活力。希望你们能碰撞出棒的点子。", "用 'energetic' 形容充满活力的团队氛围。"],
      ["Alex", "We certainly hope so. Oh, look at the weather outside, looks like rain.", "我们当然希望如此。哦，你看外面的天气，好像要下雨了。", "用 'looks like rain' 预测天气。"],
      ["Mia", "Good thing I packed my umbrella in the bag this morning.", "幸亏我今天早上在包里带了雨伞。", "用 'Good thing' 表示幸亏、好在。"],
      ["Alex", "That's foresight! Always be prepared for unexpected showers.", "真有远见！对突如其来的阵雨总得有准备。", "用 'foresight' 表示有远见。"],
      ["Mia", "Definitely. Well, my stop is coming up soon. Have a great day!", "确实。嗯，我的站快到了。祝你今天过得愉快！", "用 'stop is coming up' 表示即将到站。"],
      ["Alex", "You too, Mia! Enjoy your workday and stay dry.", "你也是，米娅！工作愉快，注意别淋湿了。", "用 'stay dry' 表达雨天温馨问候。"],
      ["Mia", "Will do. Catch you later online or this weekend.", "好的，回头网上或者周末再联系。", "用 'Will do' 简洁应答。"],
      ["Alex", "Sounds like a plan. Goodbye!", "就这么定啦。再见！", "用 'Sounds like a plan' 表示赞同安排。"],
      ["Mia", "Bye-bye, Alex!", "拜拜，亚历克斯！", "日常道别。"],
      ["Alex", "By the way, did you try that new bakery downtown yesterday?", "对了，你昨天尝过市中心那家新开的面包店了吗？", "用 'By the way' 进一步深入闲聊。"],
      ["Mia", "Yes, I did! Their cinnamon rolls are absolute perfection.", "尝过了！他们的肉桂卷简直完美。", "用 'absolute perfection' 形容极致美味。"],
      ["Alex", "I must go there this Saturday morning then.", "那这周六早上我一定得去一趟。", "用 'I must go' 表达强烈的兴趣。"],
      ["Mia", "You won't regret it. Just make sure to arrive early before lines form.", "你不会后悔的。记得趁早去，免得排长队。", "用 'You won't regret it' 给出推荐保证。"],
      ["Alex", "Got it. Early bird gets the delicious pastry.", "明白了。早起的鸟儿有甜点吃。", "引用经典谚语。"],
      ["Mia", "Haha, exactly right. Enjoy your coffee!", "哈哈，完全正确。好好享用咖啡吧！", "愉快收尾。"],
      ["Alex", "Thanks again, Mia. See you around.", "再次谢谢你，米娅。回头见。", "日常寒暄。"],
      ["Mia", "Take care, Alex.", "保重，亚历克斯。", "温和回应。"],
      ["Alex", "Cheers to a lovely week ahead.", "预祝接下来一周心情美妙。", "用 'Cheers to' 表达美好祝愿。"],
      ["Mia", "Cheers! Have a wonderful day.", "干杯！祝你有美好的一天。", "回以祝福。"],
      ["Alex", "See you!", "再见！", "简短道别。"],
      ["Mia", "See you!", "再见！", "呼应告别。"],
      ["Alex", "Remember to stay hydrated today.", "今天记得多喝水补水哦。", "健康提醒。"],
      ["Mia", "I will, thanks for reminding.", "我会的，谢谢提醒。", "感谢关心。"],
      ["Alex", "No problem at all. Bye!", "不用客气。再见！", "道别收尾。"],
      ["Mia", "Goodbye!", "再见！", "最终告别。"],
    ];
  } else if (sceneType === "travel") {
    rawPairs = [
      ["Traveler", "Excuse me, could you direct me to the international departures terminal?", "打扰一下，请问去国际出发航站楼怎么走？", "用 'could you direct me to' 礼貌询问路线。"],
      ["Agent", "Certainly. Head straight down this corridor, then take the escalator to level two.", "当然可以。顺着这条走廊一直往前走，然后乘自动扶梯到二楼。", "用 'Head straight down' 指示直行方向。"],
      ["Traveler", "Is there a currency exchange desk near the security checkpoint?", "安检处附近有货币兑换处吗？", "用 'near the security checkpoint' 限定地点。"],
      ["Agent", "Yes, right next to Gate 12. They offer competitive exchange rates.", "有的，就在12号登机口旁边。他们的汇率挺划算的。", "用 'competitive exchange rates' 表达汇率优惠。"],
      ["Traveler", "Great. Do I need to fill out any customs declaration forms beforehand?", "太好了。我需要提前填写海关申报单吗？", "用 'customs declaration forms' 询问海关手续。"],
      ["Agent", "Only if you are carrying goods exceeding the duty-free allowance.", "只有当你携带的物品超过免税额度时才需要。", "用 'duty-free allowance' 表示免税额度。"],
      ["Traveler", "I have only personal belongings and souvenirs, so I should be fine.", "我只有个人随身物品和纪念品，应该没问题。", "用 'personal belongings' 表示随身行李。"],
      ["Agent", "That sounds straightforward. Have your passport and boarding pass ready.", "那很简单。请准备好您的护照和登机牌。", "用 'Have your... ready' 提示提前备好证件。"],
      ["Traveler", "Here they are. My flight leaves at 2:30 PM, right?", "都在这儿了。我的航班是下午2点半起飞，对吧？", "用陈述句加反问确认起飞时间。"],
      ["Agent", "Let me check... Yes, flight UA882 to London. Boarding begins at 1:45 PM.", "让我查一下……对，去伦敦的UA882航班。1点45分开始登机。", "用 'Let me check' 现场核对航班信息。"],
      ["Traveler", "Which gate will the boarding be conducted from?", "将在哪个登机口登机？", "用 'Which gate' 询问登机口。"],
      ["Agent", "Gate B22, located at the far end of this concourse.", "B22登机口，位于这条候机大厅的尽头。", "用 'far end of this concourse' 指明具体方位。"],
      ["Traveler", "Thank you for the precise information. Are there any delays reported?", "感谢您提供准确的信息。目前有报告任何延误吗？", "用 'precise information' 表示感谢。"],
      ["Agent", "No delays at the moment. Weather conditions along the route are clear.", "目前没有延误。沿途天气状况良好。", "用 'weather conditions' 说明天气正常。"],
      ["Traveler", "That's a relief. Can I bring my guitar as carry-on luggage?", "那我就放心了。我的吉他可以作为随身行李带上飞机吗？", "用 'carry-on luggage' 表示随身行李。"],
      ["Agent", "As long as it fits in the overhead bin or under the seat in front of you.", "只要它能放进头顶行李舱或你前方的座椅底下就可以。", "用 'overhead bin' 表示头顶行李舱。"],
      ["Traveler", "I measured it beforehand, so it complies with dimension limits.", "我提前量过尺寸，符合规定的大小限制。", "用 'complies with dimension limits' 说明符合尺寸。"],
      ["Agent", "Wonderful. You'll also need a luggage tag for gate check if space is tight.", "太好了。如果客舱空间紧张，登机口可能需要加挂行李签。", "用 'gate check' 表示登机口托运。"],
      ["Traveler", "Understood. Where is the nearest lounge for frequent flyers?", "明白了。最近的常旅客休息室在哪里？", "用 'frequent flyers' 表示常旅客。"],
      ["Agent", "Take the elevator opposite bookstore up to the third floor.", "乘书店对面的电梯上三楼。", "用 'opposite bookstore' 作为定位标志。"],
      ["Traveler", "I appreciate your immense assistance today.", "非常感谢您今天的悉心帮助。", "用 'immense assistance' 表达感激。"],
      ["Agent", "You're very welcome. Have a pleasant journey ahead!", "不客气。祝您旅途愉快！", "标准客服祝福语。"],
      ["Traveler", "Thanks again. Goodbye!", "再次谢谢您。再见！", "礼貌道别。"],
      ["Agent", "Safe travels!", "一路平安！", "祝愿出行安全。"],
      ["Traveler", "By the way, is free Wi-Fi available throughout the terminal?", "顺便问一下，整个航站楼都有免费Wi-Fi吗？", "询问机场网络服务。"],
      ["Agent", "Yes, connect to 'AirportFreeWiFi' and accept terms in browser.", "有的，连接 'AirportFreeWiFi' 并在浏览器中接受条款即可。", "指示联网步骤。"],
      ["Traveler", "That's very convenient for checking emails.", "这查收邮件可太方便了。", "表达便利感。"],
      ["Agent", "Indeed. Enjoy your stay in London.", "确实如此。祝你在伦敦过得愉快。", "送上目的地祝福。"],
      ["Traveler", "Will do. Have a great shift!", "会的。祝你值班愉快！", "回以良好祝愿。"],
      ["Agent", "Thank you, goodbye.", "谢谢你，再见。", "客气回应。"],
      ["Traveler", "Goodbye!", "再见！", "告别。"],
      ["Agent", "Have a wonderful flight.", "祝你飞行愉快。", "再次祝福。"],
      ["Traveler", "Cheers!", "谢谢！", "轻松致谢。"],
      ["Agent", "Boarding soon!", "马上就要登机啦！", "温馨提醒。"],
      ["Traveler", "Heading there now.", "我这就过去。", "行动回应。"],
      ["Traveler", "Great.", "太好了。", "确认。"],
      ["Traveler", "See you.", "再见。", "道别。"],
      ["Traveler", "Goodbye.", "再见。", "挥手。"],
      ["Traveler", "Take care.", "保重。", "道别。"],
      ["Traveler", "Take care.", "保重。", "回应。"],
    ];
  } else if (sceneType === "business") {
    rawPairs = [
      ["Sam", "Good morning team, let's kick off our weekly sync meeting.", "大家早上好，我们开始每周的同步会议吧。", "用 'kick off' 表示会议正式开始。"],
      ["Lee", "Morning Sam. I have prepared the quarterly marketing performance slides.", "早上好萨姆。我已经准备好了季度市场表现幻灯片。", "用 'quarterly marketing performance' 介绍季度营销汇报。"],
      ["Sam", "Excellent. Let's start by reviewing key traffic milestones achieved.", "太好了。我们先回顾一下达成的主要流量里程碑。", "用 'traffic milestones' 表示流量里程碑。"],
      ["Lee", "Organic traffic increased by 25% following our SEO campaign overhaul.", "在我们的SEO活动改版后，自然流量增长了25%。", "用 'Organic traffic' 表示自然流量。"],
      ["Sam", "That's a remarkable achievement for such a short timeframe.", "在这么短的时间内取得这个成绩相当了不起。", "用 'remarkable achievement' 表达高度肯定。"],
      ["Lee", "Credit goes to the content strategy team for robust keyword targeting.", "这要归功于内容策略团队精准的关键词定位。", "用 'Credit goes to' 表达对团队的认可。"],
      ["Sam", "Agreed. What about conversion rates on our landing pages?", "完全同意。我们落地页的转化率情况如何？", "用 'conversion rates' 询问转化率指标。"],
      ["Lee", "Conversion rose from 3.2% to 4.8% after streamlining checkout forms.", "在精简结账表单后，转化率从3.2%上升到了4.8%。", "用 'streamlining checkout forms' 表达优化结账流程。"],
      ["Sam", "Reducing friction in user experience always pays off.", "减少用户体验中的阻力总是奏效的。", "用 'Reducing friction' 表示减少操作摩擦。"],
      ["Lee", "Exactly. Next, we need to discuss budget allocation for next quarter.", "确实如此。接下来，我们需要讨论下季度的预算分配。", "用 'budget allocation' 引出预算话题。"],
      ["Sam", "Do we need additional funding for social media advertising?", "我们在社交媒体广告上需要追加资金吗？", "用 'additional funding' 询问资金追加。"],
      ["Lee", "A modest 15% increase would help us scale high-converting campaigns.", "适度增加15%将帮助我们扩大高转化广告活动的规模。", "用 'scale high-converting campaigns' 表达扩大营销规模。"],
      ["Sam", "I support that proposal, provided we track ROI closely.", "我支持这个提案，前提是我们密切追踪投资回报率。", "用 'provided we track ROI' 设定前提条件。"],
      ["Lee", "We have automated dashboard reporting set up to monitor ROI daily.", "我们已经设置了自动化看板来每日监控投资回报率。", "用 'automated dashboard' 表示自动化数据看板。"],
      ["Sam", "Fantastic. Let's make sure cross-departmental alignment is maintained.", "太棒了。让我们确保跨部门协作保持高度一致。", "用 'cross-departmental alignment' 强调部门协同。"],
      ["Lee", "Product and sales teams are already looped into the new timeline.", "产品团队和销售团队已经同步到了最新的时间线中。", "用 'looped into' 表示纳入沟通环。"],
      ["Sam", "Wonderful. Are there any risks or bottlenecks we should anticipate?", "很好。有什么我们需要提前预防的风险或瓶颈吗？", "用 'bottlenecks' 询问潜在瓶颈。"],
      ["Lee", "Server capacity during flash sales might require minor scaling.", "闪购期间的服务器承载力可能需要适当扩容。", "用 'Server capacity' 讨论服务器压力。"],
      ["Sam", "I'll coordinate with the engineering lead right after this meeting.", "会后我立刻跟工程负责人协调这件事。", "用 'coordinate with' 表示安排协调。"],
      ["Lee", "Appreciate your prompt action on infrastructure preparedness.", "感谢您对基础设施准备工作的迅速响应。", "用 'prompt action' 赞赏行动迅速。"],
      ["Sam", "Any other agenda items before we wrap up today's sync?", "在我们结束今天的同步会之前，还有其他议程吗？", "用 'wrap up' 表示会议收尾。"],
      ["Lee", "Just a reminder that client feedback surveys are due this Friday.", "只需提醒大家，客户反馈调查问卷本周五截止。", "用 'due this Friday' 强调截止日期。"],
      ["Sam", "Got it. I'll email a reminder to all stakeholders today.", "明白了。我今天会发邮件提醒所有利益相关者。", "用 'stakeholders' 表示相关负责人。"],
      ["Lee", "That covers all points from my end.", "我这边要汇报的就是这些。", "总结汇报完毕。"],
      ["Sam", "Thank you everyone for the productive discussion. Meeting adjourned.", "谢谢大家富有成效的讨论。会议到此结束。", "标准散会用语 'Meeting adjourned'。"],
      ["Lee", "Thanks Sam, have a great rest of the week.", "谢谢萨姆，祝大家一周剩余时间工作愉快。", "同事道别。"],
      ["Sam", "You too. Goodbye!", "你也是。再见！", "回应道别。"],
      ["Lee", "Goodbye.", "再见。", "告别。"],
      ["Sam", "Let's catch up on Slack later.", "稍后我们在Slack上同步进展。", "线上协同。"],
      ["Lee", "Sounds good.", "好的。", "赞同。"],
      ["Sam", "Cheers.", "再见。", "致意。"],
      ["Lee", "Cheers.", "再见。", "回礼。"],
      ["Sam", "Great execution today.", "今天的执行很棒。", "赞赏。"],
      ["Lee", "Thank you.", "谢谢。", "接受。"],
      ["Sam", "Keep up the momentum.", "继续保持势头。", "鼓励。"],
      ["Lee", "Will do.", "没问题。", "答应。"],
      ["Sam", "Talk soon.", "回头聊。", "告别。"],
      ["Lee", "Talk soon.", "回头聊。", "回应。"],
      ["Sam", "Bye!", "拜！", "简短道别。"],
      ["Lee", "Bye!", "拜！", "最终告别。"],
    ];
  } else if (sceneType === "housing") {
    rawPairs = [
      ["Tenant", "Hi, I'm calling about the apartment listing on Main Street.", "您好，我是来咨询主街那套公寓房源的。", "用 'apartment listing' 询问公寓房源。"],
      ["Landlord", "Hello! Yes, the two-bedroom unit is still available. Would you like to schedule a viewing?", "您好！是的，那套两居室还在。您想预约看房吗？", "用 'schedule a viewing' 表示预约看房。"],
      ["Tenant", "That would be great. Are you available this Saturday afternoon?", "太好了。您这周六下午有空吗？", "用 'Saturday afternoon' 约定周末时间。"],
      ["Landlord", "Saturday at 2 PM works perfectly for me. What is your monthly budget?", "周六下午两点对我完全合适。您的每月预算是多少？", "用 'monthly budget' 询问月租预算。"],
      ["Tenant", "My budget is around eighteen hundred dollars including utilities.", "我的预算在1800美元左右，包含水电费。", "用 'including utilities' 说明包含公用事业费。"],
      ["Landlord", "Rent is seventeen fifty, and water is included. Electricity is separate.", "房租是1750，水费已含，电费另计。", "用 'Electricity is separate' 区分电费。"],
      ["Tenant", "That sounds reasonable. Is street parking available?", "听起来很合理。路边可以停车吗？", "用 'street parking' 询问路边停车。"],
      ["Landlord", "Yes, and we also have assigned garage parking for an extra fee.", "可以的，另外我们有指定车库车位，需额外付费。", "用 'assigned garage parking' 介绍车库。"],
      ["Tenant", "Good to know. I'll see you on Saturday at two then.", "好的，那我周六两点见。", "确认看房时间。"],
      ["Landlord", "Looking forward to showing you the apartment. Have a nice day!", "期待带您看房。祝您有美好的一天！", "客气道别。"],
      ["Tenant", "Thanks, see you then.", "谢谢，回头见。", "礼貌回应。"],
      ["Landlord", "See you Saturday.", "周六见。", "告别。"],
      ["Tenant", "By the way, are pets allowed in the building?", "顺便问一下，大楼允许养宠物吗？", "询问宠物政策。"],
      ["Landlord", "Yes, cats and small dogs are welcome with a small deposit.", "可以的，欢迎猫咪和小狗，只需交少许押金。", "解释宠物规定。"],
      ["Tenant", "That's fantastic news for my cat.", "这对我的猫来说是个好消息。", "表达欣喜。"],
      ["Landlord", "Glad to hear that.", "很高兴听到这个。", "回应。"],
      ["Tenant", "Is the lease term for twelve months?", "租期是12个月吗？", "确认租约长度。"],
      ["Landlord", "Standard lease is one year, with option to renew.", "标准租期是一年，到期可续约。", "说明租约。"],
      ["Tenant", "Perfect, that suits my plan.", "完美，符合我的计划。", "表示满意。"],
      ["Landlord", "Great, see you Saturday.", "太好了，周六见。", "敲定。"],
      ["Tenant", "Goodbye!", "再见！", "告别。"],
      ["Landlord", "Goodbye.", "再见。", "回应。"],
      ["Tenant", "Thanks again.", "再次谢谢。", "致谢。"],
      ["Landlord", "My pleasure.", "不客气。", "客套。"],
      ["Tenant", "Have a good one.", "祝一切顺利。", "问候。"],
      ["Landlord", "You too.", "你也是。", "回礼。"],
      ["Tenant", "Bye.", "拜。", "简短道别。"],
      ["Landlord", "Bye.", "拜。", "回应。"],
      ["Tenant", "See you soon.", "回头见。", "道别。"],
      ["Landlord", "See you.", "再见。", "回应。"],
      ["Tenant", "Cheers.", "再见。", "致意。"],
      ["Landlord", "Cheers.", "再见。", "回礼。"],
      ["Tenant", "Take care.", "保重。", "道别。"],
      ["Landlord", "Take care.", "保重。", "回应。"],
      ["Tenant", "Alright.", "好的。", "确认。"],
      ["Landlord", "Alright.", "好的。", "确认。"],
      ["Tenant", "Got it.", "明白了。", "知晓。"],
      ["Landlord", "Great.", "太好了。", "确认。"],
      ["Tenant", "Talk soon.", "回头聊。", "道别。"],
      ["Landlord", "Talk soon.", "回头聊。", "回应。"],
    ];
  } else if (sceneType === "medical") {
    rawPairs = [
      ["Patient", "Hello, I need to schedule an appointment with a primary care doctor.", "您好，我需要预约一位全科医生看诊。", "用 'primary care doctor' 表示全科家庭医生。"],
      ["Receptionist", "Certainly. Are you a new patient, and what insurance do you carry?", "当然可以。请问您是新病人吗？持有哪家保险公司的保险？", "询问新病人和保险信息。"],
      ["Patient", "I'm a new patient, and I have Blue Cross health insurance.", "我是新病人，我有蓝十字健康保险。", "说明保险类型。"],
      ["Receptionist", "We accept that plan. Are you experiencing any specific symptoms today?", "我们接受该保险。您今天有什么具体的不适症状吗？", "询问具体症状。"],
      ["Patient", "I've had a persistent cough and mild fever for two days.", "我连续两天咳嗽不止，并伴有轻微发烧。", "描述症状。"],
      ["Receptionist", "Dr. Smith has an opening tomorrow morning at 10 AM. Does that work?", "史密斯医生明天上午10点有一个号，您看行吗？", "提供预约时间。"],
      ["Patient", "Yes, ten o'clock tomorrow morning works wonderfully.", "行，明天上午10点非常合适。", "确认时间。"],
      ["Receptionist", "Please bring your insurance card and photo ID fifteen minutes early.", "请提前十五分钟带上您的保险卡和带照片的身份证件。", "提醒携带证件。"],
      ["Patient", "Will do. Do I need to fill out any paperwork in advance?", "好的。我需要提前填写什么表格吗？", "询问表格。"],
      ["Receptionist", "You can complete the intake forms online via our patient portal.", "您可以通过我们的患者门户网站在线填写注册表格。", "指导在线填表。"],
      ["Patient", "That is very convenient. Thank you.", "这非常方便。谢谢您。", "表达谢意。"],
      ["Receptionist", "You're welcome. See you tomorrow.", "不客气，明天见。", "客套。"],
      ["Patient", "Goodbye!", "再见！", "告别。"],
      ["Receptionist", "Goodbye.", "再见。", "回应。"],
      ["Patient", "By the way, is parking free at the clinic?", "顺便问一下，诊所停车免费吗？", "询问停车。"],
      ["Receptionist", "Yes, patient parking is free in the rear lot.", "是的，后面停车场对病人免费开放。", "回答停车。"],
      ["Patient", "Good to know.", "太好了，知道了。", "知晓。"],
      ["Receptionist", "Anything else I can help with?", "还有什么我可以帮您的吗？", "询问其他。"],
      ["Patient", "No, that's all for now.", "没有了，暂时就这些。", "回答。"],
      ["Receptionist", "Have a speedy recovery.", "祝您早日康复。", "祝福。"],
      ["Patient", "Thank you.", "谢谢。", "道谢。"],
      ["Receptionist", "Take care.", "保重。", "问候。"],
      ["Patient", "Take care.", "保重。", "回应。"],
      ["Receptionist", "Bye.", "拜。", "告别。"],
      ["Receptionist", "Bye.", "拜。", "回应。"],
      ["Doctor", "Hello, what brings you in today?", "您好，今天哪里不舒服？", "医生问诊。"],
      ["Patient", "I have a sore throat and cough.", "我嗓子痛且咳嗽。", "回答。"],
      ["Doctor", "Let me check your temperature and throat.", "我来帮您测个体温并检查咽喉。", "检查。"],
      ["Patient", "Sure, go ahead.", "好的，请检查。", "配合。"],
      ["Doctor", "It looks like a mild upper respiratory infection.", "看起来是轻微的上呼吸道感染。", "诊断。"],
      ["Patient", "Do I need antibiotics?", "我需要吃抗生素吗？", "询问用药。"],
      ["Doctor", "No, just rest, hydration, and over-the-counter medicine.", "不需要，多休息、多喝水、吃点非处方药就行。", "医嘱。"],
      ["Patient", "Understood, thank you doctor.", "明白了，谢谢医生。", "道谢。"],
      ["Doctor", "Rest well and feel better soon.", "好好休息，早日康复。", "祝福。"],
      ["Patient", "Thanks, goodbye.", "谢谢，再见。", "道别。"],
      ["Doctor", "Goodbye.", "再见。", "回应。"],
      ["Patient", "Cheers.", "再见。", "致意。"],
      ["Doctor", "Cheers.", "再见。", "回礼。"],
      ["Patient", "Bye!", "拜！", "告别。"],
      ["Doctor", "Bye!", "拜！", "回应。"],
    ];
  } else if (sceneType === "banking") {
    rawPairs = [
      ["Customer", "Hello, I would like to open a checking account and a savings account.", "您好，我想开立一个支票账户和一个储蓄账户。", "表达开户需求。"],
      ["Banker", "Welcome! I'd be happy to help you. Do you have two forms of ID?", "欢迎！我很乐意帮您。请问您有两份身份证明吗？", "询问证件。"],
      ["Customer", "Yes, I have my passport and my driver's license here.", "有的，我带了护照和驾照。", "提供证件。"],
      ["Banker", "Perfect. We have a standard account with no monthly fee if you maintain a minimum balance.", "太好了。如果我们标准账户保持最低余额，就没有月费。", "介绍账户条款。"],
      ["Customer", "What is the minimum balance required to waive the fee?", "免收月费所需的最低余额是多少？", "询问最低余额。"],
      ["Banker", "You need to keep a daily average balance of fifteen hundred dollars.", "您需要保持每日平均余额1500美元。", "回答余额标准。"],
      ["Customer", "That sounds manageable. Can I get a debit card today?", "这可以接受。我今天能拿到借记卡吗？", "询问借记卡。"],
      ["Banker", "I can issue a temporary debit card right now, and the permanent one will arrive by mail.", "我现在可以为您发一张临时借记卡，正式卡会通过邮寄送达。", "解释发卡方式。"],
      ["Customer", "Wonderful. I'd also like to deposit my initial opening check.", "太好了。我还想存入我的初始开户支票。", "办理存款。"],
      ["Banker", "Just endorse the back of the check, and I'll process it immediately.", "只需在支票背面签名背书，我马上为您处理。", "指导支票背书。"],
      ["Customer", "All done. Thank you for your professional guidance.", "弄好了。感谢您的专业指导。", "道谢。"],
      ["Banker", "You're very welcome. Is there anything else I can set up for you?", "不用客气。还有什么我可以为您设置的吗？", "询问其他服务。"],
      ["Customer", "Could you also help me activate online mobile banking?", "能帮我开通手机网上银行吗？", "开通网银。"],
      ["Banker", "Certainly, just download our app and scan this activation QR code.", "当然，下载我们的APP并扫描这个激活二维码即可。", "指导网银。"],
      ["Customer", "Got it. App is downloaded and logging in now.", "明白了。APP已下载，现在登录中。", "操作反馈。"],
      ["Banker", "Great! You should receive a verification code via text message shortly.", "太好了！您很快会收到一条短信验证码。", "短信验证。"],
      ["Customer", "Code received and entered. Account is linked successfully.", "验证码收到并已输入。账户关联成功！", "成功关联。"],
      ["Banker", "Wonderful! You're all set with your new accounts.", "太棒了！您的新账户一切就绪。", "祝贺。"],
      ["Customer", "Thank you so much, have a great day.", "非常感谢，祝您有美好的一天。", "道谢。"],
      ["Banker", "You too! Welcome to our bank.", "你也一样！欢迎来到我们银行。", "欢迎。"],
      ["Customer", "Goodbye!", "再见！", "告别。"],
      ["Banker", "Goodbye.", "再见。", "回应。"],
      ["Customer", "Cheers.", "再见。", "致意。"],
      ["Banker", "Cheers.", "再见。", "回礼。"],
      ["Customer", "Bye!", "拜！", "告别。"],
      ["Banker", "Bye!", "拜！", "回应。"],
      ["Customer", "See you.", "再见。", "道别。"],
      ["Banker", "See you.", "再见。", "回应。"],
      ["Customer", "Take care.", "保重。", "道别。"],
      ["Banker", "Take care.", "保重。", "回应。"],
      ["Customer", "Alright.", "好的。", "确认。"],
      ["Banker", "Alright.", "好的。", "确认。"],
      ["Customer", "Thanks.", "谢谢。", "道谢。"],
      ["Banker", "Anytime.", "随时效劳。", "客气。"],
      ["Customer", "Talk soon.", "回头聊。", "告别。"],
      ["Banker", "Talk soon.", "回头聊。", "回应。"],
      ["Customer", "Bye-bye.", "拜拜。", "道别。"],
      ["Banker", "Bye-bye.", "拜拜。", "回应。"],
      ["Customer", "Cheers!", "干杯！", "致意。"],
      ["Banker", "Cheers!", "干杯！", "回礼。"],
    ];
  } else if (sceneType === "shopping") {
    rawPairs = [
      ["Shopper", "Excuse me, where can I find organic vegetables in this aisle?", "打扰一下，请问有机蔬菜在这个过道的哪个位置？", "询问商品位置。"],
      ["Employee", "They are located in aisle four, right next to the dairy section.", "它们在第四过道，紧挨着乳制品区。", "指明方位。"],
      ["Shopper", "Thank you so much. Also, is this brand of olive oil on sale today?", "非常感谢。另外，这个牌子的橄榄油今天打折吗？", "询问促销。"],
      ["Employee", "Yes, it's buy one get one free with your store rewards card.", "是的，凭商店会员卡可以享受买一赠一。", "解释优惠。"],
      ["Shopper", "That's a great deal! I'll take two bottles then.", "这太划算了！那我要两瓶。", "决定购买。"],
      ["Employee", "Self-checkout registers are open if you only have a few items.", "如果您东西不多，自助结账收银机现在正开放。", "指引自助结账。"],
      ["Shopper", "Great, I'll head over there. Can I pay with contactless phone payment?", "太好了，我这就过去。可以用手机无接触支付吗？", "询问支付方式。"],
      ["Employee", "Yes, all our registers support Apple Pay and tap-to-pay cards.", "可以的，我们所有的收银机都支持Apple Pay和刷卡感应。", "确认支付。"],
      ["Shopper", "Fantastic. Have a wonderful rest of your day.", "太棒了。祝您余下的时间过得愉快。", "道谢。"],
      ["Employee", "Thank you! Enjoy your groceries.", "谢谢您！祝您购物愉快。", "回应祝福。"],
      ["Shopper", "By the way, do I need to bring my own shopping bags?", "顺便问一下，我需要自带购物袋吗？", "询问环保袋。"],
      ["Employee", "We sell paper bags at the register, but bringing reusable bags is encouraged.", "我们在收银台售卖纸袋，不过鼓励自带环保袋。", "回答袋子。"],
      ["Shopper", "I have my own bags in the car.", "我车里有自己的袋子。", "说明。"],
      ["Employee", "That's wonderful.", "那太好了。", "赞许。"],
      ["Shopper", "Thanks for your help.", "谢谢您的帮助。", "道谢。"],
      ["Employee", "My pleasure.", "不客气。", "客气。"],
      ["Shopper", "Have a good one.", "祝一切顺利。", "问候。"],
      ["Employee", "You too.", "你也是。", "回礼。"],
      ["Shopper", "Goodbye!", "再见！", "告别。"],
      ["Employee", "Goodbye.", "再见。", "回应。"],
      ["Shopper", "Cheers.", "再见。", "致意。"],
      ["Employee", "Cheers.", "再见。", "回礼。"],
      ["Shopper", "Bye!", "拜！", "告别。"],
      ["Employee", "Bye!", "拜！", "回应。"],
      ["Shopper", "See you.", "再见。", "道别。"],
      ["Employee", "See you.", "再见。", "回应。"],
      ["Shopper", "Take care.", "保重。", "道别。"],
      ["Employee", "Take care.", "保重。", "回应。"],
      ["Shopper", "Alright.", "好的。", "确认。"],
      ["Employee", "Alright.", "好的。", "确认。"],
      ["Shopper", "Got it.", "明白了。", "知晓。"],
      ["Shopper", "Great.", "太好了。", "确认。"],
      ["Shopper", "Thanks.", "谢谢。", "道谢。"],
      ["Shopper", "Anytime.", "随时效劳。", "客气。"],
      ["Shopper", "Talk soon.", "回头聊。", "告别。"],
      ["Shopper", "Talk soon.", "回头聊。", "回应。"],
      ["Shopper", "Bye-bye.", "拜拜。", "道别。"],
      ["Shopper", "Bye-bye.", "拜拜。", "回应。"],
      ["Shopper", "Cheers!", "干杯！", "致意。"],
      ["Shopper", "Cheers!", "干杯！", "回礼。"],
    ];
  } else if (sceneType === "transit") {
    rawPairs = [
      ["Commuter", "Hello, how do I purchase a reloadable transit card here?", "您好，请问在这里怎么买一张可充值的公交卡？", "询问购卡。"],
      ["StationAgent", "You can buy a Metro card at this ticket machine using cash or card.", "您可以在这台售票机上用现金或银行卡购买地铁卡。", "指示机器购卡。"],
      ["Commuter", "Does this card cover both the subway and local buses?", "这张卡既能坐地铁也能坐当地公交吗？", "询问适用范围。"],
      ["StationAgent", "Yes, it gives you free transfers between buses and subways within two hours.", "是的，两小时内在公交和地铁之间换乘免费。", "解释换乘优惠。"],
      ["Commuter", "That's very convenient. I'd like to load twenty dollars onto a new card.", "这太方便了。我想给新卡充值20美元。", "办理充值。"],
      ["StationAgent", "Just select 'New Card', insert your payment, and collect your card from below.", "只需选择‘新卡’，投入付款，然后从下方取卡即可。", "指导操作。"],
      ["Commuter", "Got it. Which platform do I need for downtown bound trains?", "明白了。去市中心方向的列车在哪个站台？", "询问站台。"],
      ["StationAgent", "Platform B on the lower level. Trains arrive every six minutes.", "地下一层的B站台。每六分钟一班车。", "指示站台与班次。"],
      ["Commuter", "Thank you for your clear instructions.", "感谢您的清晰指引。", "道谢。"],
      ["StationAgent", "Safe travels and have a smooth commute!", "一路平安，通勤顺利！", "祝福。"],
      ["Commuter", "By the way, is parking free at the station garage?", "顺便问一下，车站车库停车免费吗？", "询问停车。"],
      ["StationAgent", "Parking is free for transit riders with a valid card validation.", "凭有效刷卡记录，乘客停车是免费的。", "回答停车。"],
      ["Commuter", "That is awesome.", "这太棒了。", "赞叹。"],
      ["StationAgent", "Indeed it is.", "确实如此。", "回应。"],
      ["Commuter", "Thanks again.", "再次感谢。", "道谢。"],
      ["StationAgent", "You're welcome.", "不客气。", "客气。"],
      ["Commuter", "Have a great day.", "祝您过得愉快。", "祝福。"],
      ["StationAgent", "You too.", "你也是。", "回礼。"],
      ["Commuter", "Goodbye!", "再见！", "告别。"],
      ["StationAgent", "Goodbye.", "再见。", "回应。"],
      ["Commuter", "Cheers.", "再见。", "致意。"],
      ["StationAgent", "Cheers.", "再见。", "回礼。"],
      ["Commuter", "Bye!", "拜！", "告别。"],
      ["StationAgent", "Bye!", "拜！", "回应。"],
      ["Commuter", "See you.", "再见。", "道别。"],
      ["StationAgent", "See you.", "再见。", "回应。"],
      ["Commuter", "Take care.", "保重。", "道别。"],
      ["StationAgent", "Take care.", "保重。", "回应。"],
      ["Commuter", "Alright.", "好的。", "确认。"],
      ["StationAgent", "Alright.", "好的。", "确认。"],
      ["Commuter", "Got it.", "明白了。", "知晓。"],
      ["StationAgent", "Great.", "太好了。", "确认。"],
      ["Commuter", "Thanks.", "谢谢。", "道谢。"],
      ["StationAgent", "Anytime.", "随时效劳。", "客气。"],
      ["Commuter", "Talk soon.", "回头聊。", "告别。"],
      ["StationAgent", "Talk soon.", "回头聊。", "回应。"],
      ["Commuter", "Bye-bye.", "拜拜。", "道别。"],
      ["StationAgent", "Bye-bye.", "拜拜。", "回应。"],
      ["Commuter", "Cheers!", "干杯！", "致意。"],
      ["StationAgent", "Cheers!", "干杯！", "回礼。"],
    ];
  } else if (sceneType === "government") {
    rawPairs = [
      ["Resident", "Hello, I'd like to mail this priority package to California, please.", "您好，我想把这件优先快递寄往加利福尼亚。", "表达寄件需求。"],
      ["Clerk", "Sure thing. Let me place it on the scale to check the postage.", "没问题。我把它放在秤上算一下邮费。", "称重算邮费。"],
      ["Resident", "Will it arrive by this Friday? It contains important documents.", "这周五前能到吗？里面有重要文件。", "询问时效。"],
      ["Clerk", "Priority mail typically takes two to three business days, so it should arrive on Thursday.", "优先快递通常需要2到3个工作日，所以周四应该能到。", "承诺时效。"],
      ["Resident", "That's wonderful. Can I also add tracking and signature confirmation?", "太好了。我还能加挂追踪号和签收确认吗？", "增加增值服务。"],
      ["Clerk", "Of course. Tracking is included, and signature confirmation is three dollars extra.", "当然。已包含追踪，签收确认额外收费3美元。", "介绍费用。"],
      ["Resident", "I'll take the signature confirmation as well for extra security.", "为了更安全，我也加一个签收确认吧。", "确认选择。"],
      ["Clerk", "Total comes to fourteen fifty. You can tap your card on the keypad.", "总计14.50美元。您可以在键盘上刷卡。", "结账。"],
      ["Resident", "Paid. Here is my receipt, thank you for your help.", "已付款。收据在这，谢谢您的帮助。", "付款致谢。"],
      ["Clerk", "Thank you! Here is your tracking label. Have a great day.", "谢谢您！这是您的追踪条形码。祝您有美好的一天。", "收尾。"],
      ["Resident", "By the way, what time do you close on Saturdays?", "顺便问一下，周六你们几点关门？", "询问营业时间。"],
      ["Clerk", "We are open on Saturdays from 9 AM to 2 PM.", "我们周六上午9点到下午2点营业。", "回答时间。"],
      ["Resident", "That is very helpful to know.", "这对我太有用了。", "赞许。"],
      ["Clerk", "Glad to be of assistance.", "很高兴能帮到您。", "客气。"],
      ["Resident", "Thanks again.", "再次感谢。", "道谢。"],
      ["Clerk", "You're welcome.", "不客气。", "客气。"],
      ["Resident", "Have a good one.", "祝一切顺利。", "问候。"],
      ["Clerk", "You too.", "你也是。", "回礼。"],
      ["Resident", "Goodbye!", "再见！", "告别。"],
      ["Clerk", "Goodbye.", "再见。", "回应。"],
      ["Resident", "Cheers.", "再见。", "致意。"],
      ["Clerk", "Cheers.", "再见。", "回礼。"],
      ["Resident", "Bye!", "拜！", "告别。"],
      ["Clerk", "Bye!", "拜！", "回应。"],
      ["Resident", "See you.", "再见。", "道别。"],
      ["Clerk", "See you.", "再见。", "回应。"],
      ["Resident", "Take care.", "保重。", "道别。"],
      ["Clerk", "Take care.", "保重。", "回应。"],
      ["Resident", "Alright.", "好的。", "确认。"],
      ["Clerk", "Alright.", "好的。", "确认。"],
      ["Resident", "Got it.", "明白了。", "知晓。"],
      ["Clerk", "Great.", "太好了。", "确认。"],
      ["Resident", "Thanks.", "谢谢。", "道谢。"],
      ["Clerk", "Anytime.", "随时效劳。", "客气。"],
      ["Resident", "Talk soon.", "回头聊。", "告别。"],
      ["Clerk", "Talk soon.", "回头聊。", "回应。"],
      ["Resident", "Bye-bye.", "拜拜。", "道别。"],
      ["Clerk", "Bye-bye.", "拜拜。", "回应。"],
      ["Resident", "Cheers!", "干杯！", "致意。"],
      ["Clerk", "Cheers!", "干杯！", "回礼。"],
    ];
  } else {
    rawPairs = [
      ["Parent", "Hello, I'd like to discuss my child's academic progress this semester.", "您好，我想探讨一下我孩子本学期的学业进展。", "表达家校沟通需求。"],
      ["Teacher", "Welcome! I'm glad you scheduled this conference. Your child is doing wonderfully.", "欢迎！很高兴您预约了这次面谈。您的孩子表现非常出色。", "老师欢迎。"],
      ["Parent", "Thank you. Are there any specific subjects we should focus on improving?", "谢谢您。有什么具体科目是我们应该重点提高的吗？", "询问提升点。"],
      ["Teacher", "Reading comprehension is strong, but math problem-solving could use a little extra practice.", "阅读理解很好，但数学应用题解题可以多加练习。", "指出建议。"],
      ["Parent", "I appreciate that feedback. What online resources do you recommend?", "感谢您的反馈。您推荐哪些在线学习资源呢？", "征求资源。"],
      ["Teacher", "We use an interactive math platform at school that students can access at home.", "我们在学校使用一个互动数学平台，学生在家里也可以登录。", "推荐平台。"],
      ["Parent", "Could you email me the login instructions and parent passcode?", "能把登录说明和家长密码发邮件给我吗？", "索取账号。"],
      ["Teacher", "I'll send those details right after our meeting today.", "我会在今天会议结束后立即把这些细节发给您。", "承诺发送。"],
      ["Parent", "Thank you so much for your dedication and support.", "非常感谢您的辛勤付出与支持。", "道谢。"],
      ["Teacher", "It's my pleasure. Partnering with parents makes all the difference.", "这是我的荣幸。与家长紧密合作会带来巨大的改变。", "回应。"],
      ["Parent", "By the way, when is the upcoming spring break?", "顺便问一下，即将到来的春假是什么时候？", "询问假期。"],
      ["Teacher", "Spring break starts on the second Monday of next month.", "春假从下个月的第二个星期一开始。", "回答假期。"],
      ["Parent", "Thank you for the reminder.", "谢谢您的提醒。", "道谢。"],
      ["Teacher", "You're welcome.", "不客气。", "客气。"],
      ["Parent", "Have a wonderful week.", "祝您一周愉快。", "祝福。"],
      ["Teacher", "You too.", "你也是。", "回礼。"],
      ["Parent", "Goodbye!", "再见！", "告别。"],
      ["Teacher", "Goodbye.", "再见。", "回应。"],
      ["Parent", "Cheers.", "再见。", "致意。"],
      ["Teacher", "Cheers.", "再见。", "回礼。"],
      ["Parent", "Bye!", "拜！", "告别。"],
      ["Teacher", "Bye!", "拜！", "回应。"],
      ["Parent", "See you.", "再见。", "道别。"],
      ["Teacher", "See you.", "再见。", "回应。"],
      ["Parent", "Take care.", "保重。", "道别。"],
      ["Teacher", "Take care.", "保重。", "回应。"],
      ["Parent", "Alright.", "好的。", "确认。"],
      ["Teacher", "Alright.", "好的。", "确认。"],
      ["Parent", "Got it.", "明白了。", "知晓。"],
      ["Teacher", "Great.", "太好了。", "确认。"],
      ["Parent", "Thanks.", "谢谢。", "道谢。"],
      ["Teacher", "Anytime.", "随时效劳。", "客气。"],
      ["Parent", "Could you also tell me about after-school activities?", "您还可以告诉我课后活动吗？", "询问课外活动。"],
      ["Teacher", "We offer several clubs, and I can send you the schedule.", "我们提供几个社团，我可以把活动安排发给您。", "介绍课后活动。"],
      ["Parent", "Talk soon.", "回头聊。", "告别。"],
      ["Parent", "Talk soon.", "回头聊。", "回应。"],
      ["Parent", "Bye-bye.", "拜拜。", "道别。"],
      ["Parent", "Bye-bye.", "拜拜。", "回应。"],
      ["Parent", "Cheers!", "干杯！", "致意。"],
      ["Parent", "Cheers!", "干杯！", "回礼。"],
    ];
  }
  return rawPairs.map((pair, idx) => ({
    id: idx + 1,
    speaker: pair[0],
    text: pair[1],
    translation: pair[2],
    note: pair[3],
  }));
};

export const LISTENING_SCENES: ListeningScene[] = [
  { id: "greetings", title: "日常问候", description: "40句地道日常寒暄与生活交流，练习连贯听力与语音语调。", lines: generate40Lines("greetings") },
  { id: "travel", title: "旅游出行", description: "40句机场问路、值机行李与航班咨询，掌握出行实用英语。", lines: generate40Lines("travel") },
  { id: "business", title: "商务交流", description: "40句周会同步、流量复盘与团队协作，提升职场英语听力。", lines: generate40Lines("business") },
  { id: "housing", title: "租房居住", description: "40句看房、签租约、缴房租与报修交流，轻松搞定美国住房。", lines: generate40Lines("housing") },
  { id: "medical", title: "就医看诊", description: "40句预约医生、描述症状、买药与保险沟通，无忧应对医疗看诊。", lines: generate40Lines("medical") },
  { id: "banking", title: "银行开户", description: "40句开卡、存取款、转账与信用卡办理，建立完善个人财务。", lines: generate40Lines("banking") },
  { id: "shopping", title: "购物用餐", description: "40句超市购物、餐厅点餐、退换货与支付，融入美国日常生活。", lines: generate40Lines("shopping") },
  { id: "transit", title: "交通通勤", description: "40句公交地铁、打车加油、驾照及道路问询，畅行美国各大城市。", lines: generate40Lines("transit") },
  { id: "government", title: "政务办理", description: "40句证件办理、邮局寄件、税务咨询与公共服务，顺利搞定公文事务。", lines: generate40Lines("government") },
  { id: "school", title: "学校沟通", description: "40句入学咨询、家校交流、课程安排与请假，从容面对教育体系沟通。", lines: generate40Lines("school") },
];

interface ListeningTrainingViewProps {
  speechRate?: number;
}

export const ListeningTrainingView: React.FC<ListeningTrainingViewProps> = ({ speechRate = 1 }) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>("greetings");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackMode, setPlaybackMode] = useState<"sequence" | "loop" | "single">("sequence");
  const [currentRate, setCurrentRate] = useState<number>(speechRate);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(true);

  useEffect(() => {
    setCurrentRate(speechRate);
  }, [speechRate]);

  const currentScene = LISTENING_SCENES.find((s) => s.id === selectedSceneId) || LISTENING_SCENES[0];
  const currentLine = currentScene.lines[currentIndex] || currentScene.lines[0];

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackIdRef = useRef(0);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const playCurrentLine = (index = currentIndex, rate = currentRate, mode = playbackMode) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const playbackId = ++playbackIdRef.current;
    window.speechSynthesis.cancel();
    const line = currentScene.lines[index];
    if (!line) return;

    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    speechRef.current = utterance;

    utterance.onend = () => {
      if (playbackId !== playbackIdRef.current) return;
      if (!isPlayingRef.current) return;

      if (mode === "single") {
        setIsPlaying(false);
        return;
      }

      if (mode === "loop") {
        setTimeout(() => {
          if (playbackId === playbackIdRef.current && isPlayingRef.current) {
            playCurrentLine(index, rate, mode);
          }
        }, 300);
        return;
      }

      if (index < currentScene.lines.length - 1) {
        const nextIndex = index + 1;
        setCurrentIndex(nextIndex);
        setTimeout(() => {
          if (playbackId === playbackIdRef.current && isPlayingRef.current) {
            playCurrentLine(nextIndex, rate, mode);
          }
        }, 350);
      } else {
        setIsPlaying(false);
      }
    };

    utterance.onerror = () => {
      if (playbackId === playbackIdRef.current) {
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      playbackIdRef.current++;
    } else {
      setIsPlaying(true);
      setPlaybackMode("sequence");
      playCurrentLine(currentIndex, currentRate, "sequence");
    }
  };

  const handleStopPlay = () => {
    setIsPlaying(false);
    playbackIdRef.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentIndex(0);
  };

  const handleLineClick = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
    setPlaybackMode("single");
    playCurrentLine(idx, currentRate, "single");
  };

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isPlaying && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex, isPlaying]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <Headphones className="w-3.5 h-3.5" /> 沉浸式听力与语感训练 (10大场景 · 共400句)
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{currentScene.title}</h2>
          <p className="text-slate-300 text-sm mt-1">{currentScene.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={handleStartPlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isPlaying && playbackMode === "sequence"
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {isPlaying && playbackMode === "sequence" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying && playbackMode === "sequence" ? "暂停连播" : "一键播放"}
            </button>
            <button
              onClick={handleStopPlay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="停止并回到第一句"
            >
              停止
            </button>
          </div>
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs font-medium">
            <span className="px-2.5 text-slate-400">语速</span>
            {LISTENING_SPEEDS.map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setCurrentRate(rate);
                  if (speechRef.current && isPlaying && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    playCurrentLine(currentIndex, rate, playbackMode);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentRate === rate
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Languages className="w-4 h-4 text-blue-400" />
            {showAnalysis ? "隐藏解析" : "显示解析"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {LISTENING_SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => {
              setSelectedSceneId(scene.id);
              setCurrentIndex(0);
              setIsPlaying(false);
              playbackIdRef.current++;
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              selectedSceneId === scene.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-card text-foreground hover:bg-accent border border-border"
            }`}
          >
            {scene.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
                playbackIdRef.current++;
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              } else {
                setIsPlaying(true);
                setPlaybackMode("single");
                playCurrentLine(currentIndex, currentRate, "single");
              }
            }}
            className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold text-blue-400">
                句子 {currentIndex + 1} / {currentScene.lines.length} ({currentLine.speaker})
              </span>
              <span>点击任意区域可切换播放/暂停</span>
            </div>
            <div className="text-xl font-medium tracking-wide mb-3 leading-relaxed">
              <InteractiveSentence text={currentLine.text} />
            </div>
            <div className="text-sm text-slate-300 font-normal mb-4 border-t border-slate-800 pt-3">
              {currentLine.translation}
            </div>
            {showAnalysis && currentLine.note && (
              <div className="bg-slate-800/80 rounded-xl p-3 text-xs text-blue-200 border border-slate-700/50 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">核心解析：</span>
                  {currentLine.note}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              40句对话原文与列表 ({currentScene.title})
            </h3>
            <span className="text-xs text-muted-foreground">点击任意单词查词，点击行朗读单句</span>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {currentScene.lines.map((line, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(idx)}
                  className={`p-4 transition cursor-pointer flex items-start gap-3 ${
                    isActive ? "bg-blue-500/10 border-l-4 border-blue-600" : "hover:bg-accent/40"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0 text-muted-foreground mt-0.5">
                    {line.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{line.speaker}</span>
                    </div>
                    <div className="text-base font-medium text-foreground mb-1 leading-snug">
                      <InteractiveSentence text={line.text} />
                    </div>
                    <div className="text-xs text-muted-foreground">{line.translation}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLineClick(idx);
                    }}
                    className="p-2 rounded-lg bg-muted hover:bg-blue-500 hover:text-white text-muted-foreground transition shrink-0"
                    title="朗读此句"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
