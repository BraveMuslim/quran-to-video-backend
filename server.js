const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.fields([{ name: 'image' }, { name: 'audio' }]), (req, res) => {
  const image = req.files.image?.[0];
  const audio = req.files.audio?.[0];

  if (!image || !audio) {
    return res.status(400).send("Image or audio missing");
  }

  const outputPath = `output-${Date.now()}.mp4`;

  ffmpeg()
    .addInput(image.path)
    .loop(10)
    .addInput(audio.path)
    .outputOptions('-shortest')
    .save(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(image.path);
        fs.unlinkSync(audio.path);
      });
    })
    .on('error', err => {
      console.error('FFmpeg error:', err);
      res.status(500).send('Video processing failed.');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
