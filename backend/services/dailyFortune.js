// Entertainment only. No persisted record, reward or learning side effect.
const { createHash } = require('node:crypto');
const VERSION = 'campus-fortune-v2';
const levels = ['great', 'lucky', 'small', 'steady'];
const patterns = ['fortune-plane', 'fortune-star', 'fortune-device'];
const good = ['record', 'ask', 'test', 'organize', 'listen', 'rest'];
const avoid = ['rush', 'ignore', 'compare', 'guess'];
// Each unordered pair is represented exactly once: swapping the two suggestions
// must not count as a different visible fortune.
const pairs = good.flatMap((item, i) => good.slice(i + 1).map(other => [item, other]));
const poolSize = levels.length * patterns.length * pairs.length * avoid.length; // 720
const modulo = (value, size) => ((value % size) + size) % size;
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function dailyFortune(userId, now = new Date()) {
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const day = Date.parse(date + 'T00:00:00Z') / 86400000;
  const bytes = createHash('sha256').update(`${VERSION}:${userId}`).digest();
  const offset = bytes.readUInt32BE(0) % poolSize;
  let step = 1 + bytes.readUInt32BE(4) % (poolSize - 1);
  while (gcd(step, poolSize) !== 1) step = step % (poolSize - 1) + 1;
  // Account-keyed affine permutation of the complete finite pool. A coprime step
  // visits all 720 combinations before repeating; adjacent days never collide,
  // including the cycle boundary. No process cache or database writes are needed.
  let rank = modulo(day * step + offset, poolSize);
  const take = items => { const item = items[rank % items.length]; rank = Math.floor(rank / items.length); return item; };
  const dailyAvoid = take(avoid), dailyGood = take(pairs), art = take(patterns), level = take(levels);
  return { version: VERSION, date, nextUpdateAt: new Date(Date.parse(date+'T00:00:00+08:00')+86400000).toISOString(),
    level, art, good: [...dailyGood], avoid: [dailyAvoid] };
}
module.exports = { dailyFortune, VERSION };
