// Entertainment only. No persisted record, reward or learning side effect.
const { createHash } = require('node:crypto');
const VERSION = 'campus-fortune-v1';
const levels = ['great', 'lucky', 'small', 'steady'];
const patterns = ['fortune-plane', 'fortune-star', 'fortune-device'];
const good = ['record', 'ask', 'test', 'organize', 'listen', 'rest'];
const avoid = ['rush', 'ignore', 'compare', 'guess'];
function dailyFortune(userId, now = new Date()) {
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const bytes = createHash('sha256').update(`${VERSION}:${userId}:${date}`).digest();
  return { version: VERSION, date, nextUpdateAt: new Date(Date.parse(date+'T00:00:00+08:00')+86400000).toISOString(),
    level: levels[bytes[0] % levels.length], art: patterns[bytes[1] % patterns.length],
    good: [good[bytes[2] % good.length], good[(bytes[2] % good.length + 1 + bytes[3] % (good.length-1)) % good.length]],
    avoid: [avoid[bytes[4] % avoid.length]] };
}
module.exports = { dailyFortune, VERSION };
