import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/search', async (req, res) => {
    const term = req.query.term;
    const region = req.query.region || 'cn';

    if (!term) {
        return res.status(400).json({ error: '请输入应用名称' });
    }

    try {
        const response = await axios.get('https://itunes.apple.com/search', {
            params: {
                term,
                entity: 'software',
                country: region,
                limit: 18
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: '搜索失败：' + error.message });
    }
});

// 不需要 app.listen，Vercel 会自动处理
export default app;
