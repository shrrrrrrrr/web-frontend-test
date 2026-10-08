// 全部为演示规则，不与成绩、练习分数、真实发放规则关联。
export const rewardDemoConfig = {
  initialPoints: 120,
  dailyCoins: 5,
  gifts: [
    { id: 'notebook', type:'physical', title: '探索笔记本（演示）', cost: 40, stock: 3, description: '用来记录观察与想法。此处不提供真实礼品。', limit: 2 },
    { id: 'model', type:'physical', title: '飞行模型（演示）', cost: 160, stock: 2, description: '用于体验积分不足时的兑换提示。', limit: 1 },
    { id: 'sticker', type:'physical', title: '探索贴纸（演示）', cost: 20, stock: 0, description: '用于体验库存不足时的提示。', limit: 1 },
    { id:'digital-theory',type:'badge',art:'theory',title:'探索笔记徽章（演示）',cost:30,stock:1,limit:1,description:'数字徽章演示，区别于真实课时通关徽章。' },
    { id:'digital-glider',type:'badge',art:'glider',title:'试飞纪念徽章（演示）',cost:30,stock:1,limit:1,description:'数字徽章演示，不代表完成滑翔机课时。' },
  ],
  badges: [
    { id: 'record', title: '记录一次发现（演示）', earned: true, description: '演示已获得状态；不代表真实学习评价。', condition: '此状态由演示配置预置，正式条件待制定。' },
    { id: 'iterate', title: '尝试再改进（演示）', earned: false, description: '演示尚未获得状态。', condition: '正式获取条件待制定。' },
  ],
};
