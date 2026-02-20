// server.js — Figurine Maker API Proxy
// Keeps your Replicate key 100% hidden from users

const express = require(‘express’);
const cors    = require(‘cors’);
const app     = express();

app.use(cors({ origin: ‘*’ }));
app.use(express.json({ limit: ‘25mb’ }));

const REPLICATE_KEY = process.env.REPLICATE_KEY;
if (!REPLICATE_KEY) {
console.error(‘Set REPLICATE_KEY in Railway environment variables’);
process.exit(1);
}

app.get(’/’, (req, res) => res.json({ status: ‘Figurine Maker API running’ }));

app.post(’/generate’, async (req, res) => {
try {
const { imageBase64, prompt } = req.body;
if (!imageBase64 || !prompt) return res.status(400).json({ error: ‘Missing fields’ });

```
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: { 'Authorization': `Token ${REPLICATE_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496241f10f44e4d6b5426',
    input: {
      image: imageBase64,
      prompt: prompt,
      negative_prompt: 'blurry, low quality, extra limbs, bad anatomy, text, watermark, duplicate, ugly, deformed, nsfw',
      prompt_strength: 0.80,
      num_inference_steps: 40,
      guidance_scale: 7.5,
      scheduler: 'K_EULER',
      num_outputs: 1,
      refine: 'expert_ensemble_refiner',
      high_noise_frac: 0.80,
    }
  })
});

const data = await response.json();
if (!response.ok) return res.status(response.status).json({ error: data.detail || 'Generation failed' });
res.json({ id: data.id });
```

} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/result/:id’, async (req, res) => {
try {
const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
headers: { ‘Authorization’: `Token ${REPLICATE_KEY}` }
});
const data = await response.json();
res.json({
status: data.status,
imageUrl: data.status === ‘succeeded’ ? (Array.isArray(data.output) ? data.output[0] : data.output) : null,
error: data.error || null
});
} catch (err) {
res.status(500).json({ error: err.message });
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Figurine Maker API on port ${PORT}`));
