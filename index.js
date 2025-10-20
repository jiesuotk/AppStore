// 使用 require 代替 import
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // 导入频率限制库

const app = express();
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
// 每个 IP 在 5 分钟内最多调用 30 次
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分钟
  max: 30, // 最多 30 次调用
  message: { error: '请求过于频繁，请稍后再试' },
  // 关键: 这里使用 req.ip 来限制每个 IP 地址的请求
  keyGenerator: (req, res) => req.ip,
});

// 在安全搜索接口上应用频率限制
app.use('/safe-search', limiter);

// 安全搜索接口
// 前端现在将调用这个接口
app.get('/safe-search', async (req, res) => {
  // 从请求头中获取 Origin
  const origin = req.headers.origin;

  // 如果请求的 Origin 不在允许的域名列表中，则返回 JSON 格式的错误信息
  // 这将帮助前端正确处理，避免 "Unexpected token '<'" 错误
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: '未经授权的访问: 域名不匹配' });
  }

  // 从请求中获取 app 名称、地区和搜索数量
  const term = req.query.term;
  const region = req.query.region || 'cn';
  const limit = req.query.limit || 12;

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

// 关键：不使用 app.listen
// 使用 module.exports 代替 export default
module.exports = app;
