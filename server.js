const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.post('/upload', upload.fields([{ name: 'image' }, { name: 'audio' }]), (req, res) => {
  const imagePath = req.files.image[0].path;
  const audioPath = req.files.audio[0].path;
  const outputPath = `output/${Date.now()}.mp4`;

  const cmd = `ffmpeg -loop 1 -i ${imagePath} -i ${audioPath} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -movflags +faststart ${outputPath}`;

  exec(cmd, (err) => {
    if (err) {
      console.error('FFmpeg error:', err);
      return res.status(500).send('FFmpeg failed');
    }

    res.download(outputPath, () => {
      fs.unlinkSync(imagePath);
      fs.unlinkSync(audioPath);
      fs.unlinkSync(outputPath);
    });
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
