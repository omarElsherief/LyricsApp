import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GENIUS_API_KEY = process.env.GENIUS_API_KEY;

app.use(cors());

// Proxy endpoint for Genius API
app.get('/api/genius', async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query parameter' });
  }

  if (!GENIUS_API_KEY) {
    return res.status(500).json({ error: 'GENIUS_API_KEY is not configured' });
  }

  try {
    const url = `https://api.genius.com${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GENIUS_API_KEY}`,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Genius API proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Genius API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
