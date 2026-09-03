import express from 'express';
import multer from 'multer';
import { decompress } from 'fzstd';

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'faceit-decompressor'
  });
});

app.post('/decompress', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Missing multipart file field: file'
      });
    }

    const compressed = new Uint8Array(req.file.buffer);
    const decompressed = decompress(compressed);

    const originalName = req.file.originalname || 'match.dem.zst';
    const outputName = originalName.endsWith('.zst')
      ? originalName.slice(0, -4)
      : `${originalName}.dem`;

    res.setHeader(
      'Content-Type',
      'application/octet-stream'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${outputName}"`
    );

    res.send(Buffer.from(decompressed));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Decompression failed',
      details: error.message
    });
  }
});

const port = Number(process.env.PORT || 8080);

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`);
});