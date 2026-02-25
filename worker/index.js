const Queue = require('bull');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const pdfQueue = new Queue('pdf-generation', `redis://${process.env.REDIS_HOST}:6379`);

console.log('Worker waiting for jobs...');

pdfQueue.process('generate', async (job) => {
  const { name, role } = job.data;

  console.log(`------------------------------------------------`);
  console.log(`🖨️  Starting PDF Generation for ${name}`);

  try {
    // 1. Launch Chromium (We use the flags required for Docker/Alpine)
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Critical for Docker
    });

    const page = await browser.newPage();

    // 2. Create HTML Content
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="color: #333;">Resume</h1>
          <hr/>
          <h2>${name}</h2>
          <p><strong>Role:</strong> ${role}</p>
          <p>This is a generated CV content.</p>
        </body>
      </html>
    `;

    // 3. Load HTML
    await page.setContent(htmlContent);

    // 4. Create filename and path
    const filename = `cv-${name.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
    const filePath = path.join('/app/output', filename); // /app/output is our mounted volume

    // 5. Print to PDF
    await page.pdf({ path: filePath, format: 'A4' });
    await browser.close();

    console.log(`✅ PDF Saved: ${filename}`);
    console.log(`------------------------------------------------`);
    
    return { success: true, filename };

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
});