import express from 'express';

const app = express();
app.use(express.json());

app.post('/bot', (req, res) => {
  const userMessage = req.body.content || '';
  console.log('收到用户消息:', userMessage);

  let reply = `你刚才说了：“${userMessage}”，我已收到！`;

  res.json({
    content: reply,
    private: false
  });
});

export default app;
