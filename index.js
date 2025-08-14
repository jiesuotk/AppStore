import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/search', async (req, res) => {
  const term = req.query.term;
  if (!term) return res.status(400).json({ error: '请输入应用名称' });

  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: { term, entity: 'software', country: 'cn', limit: 5 }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
