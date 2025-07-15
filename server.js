const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', ws => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

// Send progress to all connected clients
function broadcastProgress(percent) {
  const data = JSON.stringify({ type: 'progress', percent });
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

app.post('/upload', upload.fields([{ name: 'image' }, { name: 'audio' }]), (req, res) => {
  const image = req.files.image?.[0];
  const audio = req.files.audio?.[0];

  if (!image || !audio) {
    return res.status(400).send("Image or audio missing");
  }

  const outputPath = `output-${Date.now()}.mp4`;

  const command = ffmpeg()
    .addInput(image.path)
    .loop(10)
    .addInput(audio.path)
    .outputOptions('-shortest')
    .on('start', commandLine => {
      console.log('FFmpeg started:', commandLine);
      broadcastProgress(0); // Send 0% start
    })
    .on('progress', progress => {
      const percent = Math.min(progress.percent || 0, 100);
      console.log(`Progress: ${percent.toFixed(2)}%`);
      broadcastProgress(percent.toFixed(2));
    })
    .on('end', () => {
      console.log('FFmpeg finished');
      broadcastProgress(100); // Final 100%

      res.download(outputPath, () => {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(image.path);
        fs.unlinkSync(audio.path);
      });
    })
    .on('error', err => {
      console.error('FFmpeg error:', err.message);
      res.status(500).send('Video processing failed.');
    });

  command.save(outputPath);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Backend + WebSocket server running on port ${PORT}`);
});
