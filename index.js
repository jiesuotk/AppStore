const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); 

const app = express();

// 告诉 Express 信任 Vercel 代理
app.set('trust proxy', 1); // <--- 在这里添加这一行

app.use(cors());

// 从 Vercel 环境变量中获取允许的域名
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : [];

// 测试根路径
app.get('/', (req, res) => {
  res.send('App Store Search API is running!');
});

// 配置频率限制中间件
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 50, 
  message: { error: '请求过于频繁，请稍后再试' },
  // 关键: 现在 req.ip 会被正确填充，所以这里不再需要 keyGenerator
  // keyGenerator: (req, res) => req.ip, // <--- (可选) 你甚至可以删除这一行，因为默认就是使用 req.ip
});

// 在安全搜索接口上应用频率限制
app.use('/safe-search', limiter);

// 安全搜索接口
app.get('/safe-search', async (req, res) => {
  const origin = req.headers.origin;

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: '未经授权的访问: 域名不匹配' });
  }

  const term = req.query.term;
  const region = req.query.region || 'cn';
  const limit = req.query.limit || 10;

  if (!term) {
    return res.status(400).json({ error: '请输入应用名称' });
  }

  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term,
        entity: 'software',
        country: region,
        limit
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
