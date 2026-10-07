const router = require('express').Router();
const { requireAuth, requirePasswordChanged, requireRole } = require('../middleware/auth');
const { dailyFortune } = require('../services/dailyFortune');
router.get('/daily-fortune', requireAuth, requirePasswordChanged, requireRole('student'), (req, res) => {
  if (Object.keys(req.query).length) return res.status(400).json({error:'运势由当前账号和服务器日期决定',code:'FORTUNE_QUERY_NOT_ALLOWED'});
  res.setHeader('Cache-Control', 'no-store');
  res.json(dailyFortune(req.user.id));
});
module.exports = router;
