const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Queue = require('bull');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/output', express.static(path.join(__dirname, 'output')));

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: 'cv_user',
  password: 'cv_password',
  database: 'cv_db',
});

// Redis Queue Connection
const pdfQueue = new Queue('pdf-generation', `redis://${process.env.REDIS_HOST}:6379`);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'API is running', status: 'healthy' });
});

// New Route: Create CV Job
app.post('/create-cv', async (req, res) => {
  const { name, role } = req.body;

  //validation
  if (!name || !role){
      return res.status(400).json({message: 'Name and Role are required'});
  }

  console.log(`Received request to generate CV for ${name}`);

  //1. ADd job to the Redis Queue
  // We pass the data {name, role} to the worker
  const job = await pdfQueue.add('generate', { name, role });

  //2 Respond to the Frontend immediately (Dont wait for the PDF!)
  res.json({
    mmessage: `CV generation started for ${name}! (Job ID: ${job.id})`
  });
})

// Job Creator Route
app.post('/generate-cv', async (req, res) => {
  const job = await pdfQueue.add('generate', { data: req.body });
  res.json({ jobId: job.id });
});

// New Route: List all generated CVs
app.get('/list-cvs', (req, res) => {
  const directoryPath = path.join(__dirname, 'output');

  // Read the folder
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Unable to scan files' });
    }

    // Filter only PDF files
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    // Create download URLs
    const fileLinks = pdfFiles.map(file => ({
      name: file,
      url: `http://192.168.100.53:3001/output/${file}`
    }));

    res.json(fileLinks);
  });
});

// Start Server
app.listen(3000, () => {
  console.log('Backend running on port 3000');
});
