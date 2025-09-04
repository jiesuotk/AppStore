// api/app.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// 允许所有来源访问，或者改成指定域名
app.use(cors());

// 限制频率：每个 IP 每分钟最多调用 10 次
const limiter = rateLimit({
  windowMs: 300 * 1000, // 1 分钟
  max: 10,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/search', limiter);

// API Key 中间件（只在服务器端验证）
const SERVER_API_KEY = process.env.API_KEY; // 在 Vercel 设置环境变量
app.use((req, res, next) => {
  const key = req.headers['x-api-key']; // 客户端不需要知道真实 Key，可以用内部约定 token
  if (!key || key !== SERVER_API_KEY) {
    return res.status(401).json({ error: '无效的 API Key' });
  }
  next();
});

// 根路径测试
app.get('/', (req, res) => {
  res.send('App Store Search API is running!');
});

// 搜索接口
app.get('/search', async (req, res) => {
  const term = req.query.term;
  const region = req.query.region || 'cn';
  const limit = req.query.limit || 10;

  if (!term) return res.status(400).json({ error: '请输入应用名称' });

  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: { term, entity: 'software', country: region, limit }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
