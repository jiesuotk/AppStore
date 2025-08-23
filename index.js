import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

// 测试根路径
app.get('/', (req, res) => {
  res.send('App Store Search API is running!');
});

// 搜索接口
app.get('/search', async (req, res) => {
  // 从请求中获取 app 名称、地区和搜索数量
  const term = req.query.term;
  const region = req.query.region || 'cn';
  const limit = req.query.limit || 10; // 从查询参数中获取数量，默认为10

  if (!term) {
    return res.status(400).json({ error: '请输入应用名称' });
  }

  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term,
        entity: 'software',
        country: region,
        limit // <--- 将动态获取的 limit 变量传递给 API
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 关键：不使用 app.listen
export default app;
