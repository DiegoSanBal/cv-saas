const Queue = require('bull');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const pdfQueue = new Queue('pdf-generation', `redis://${process.env.REDIS_HOST}:6379`);

console.log('Worker waiting for jobs...');

pdfQueue.process('generate', async (job) => {
  const { fullName, jobTitle, email, phone, summary, experience, education, skills } = job.data;

  console.log(`------------------------------------------------`);
  console.log(`🖨️  Generating Professional CV for ${fullName}`);

  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Helper to convert newlines to <br> tags
    const nl2br = (text) => (text || '').replace(/\n/g, '<br/>');

    // Helper to format Experience lines
    const formatExperience = (text) => {
      if (!text) return '';
      return (text || '').split('\n').map(line => {
        const parts = line.split('|');
        return `
          <div class="job-item">
            <div class="job-header">
              <strong>${parts[0] || line}</strong>
              ${parts[1] ? `<span class="job-date">${parts[1]}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .name { font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
          .title { font-size: 18px; color: #555; margin-top: 5px; font-weight: 600; }
          .contact-info { margin-top: 10px; font-size: 14px; color: #666; }
          
          h2 { font-size: 16px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; color: #222; }
          
          .section-content { margin-top: 15px; font-size: 14px; }
          
          .job-item { margin-bottom: 15px; }
          .job-header { display: flex; justify-content: space-between; align-items: baseline; }
          .job-date { font-style: italic; color: #666; font-size: 13px; }
          
          .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
          .skill-tag { background: #eee; padding: 5px 10px; border-radius: 4px; font-size: 13px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="name">${fullName}</h1>
          <div class="title">${jobTitle}</div>
          <div class="contact-info">
            ${email} | ${phone}
          </div>
        </div>

        <section>
          <h2>Professional Summary</h2>
          <div class="section-content">
            ${nl2br(summary)}
          </div>
        </section>

        <section>
          <h2>Experience</h2>
          <div class="section-content">
            ${formatExperience(experience)}
          </div>
        </section>

        <section>
          <h2>Education</h2>
          <div class="section-content">
            ${nl2br(education)}
          </div>
        </section>

        <section>
          <h2>Skills</h2>
          <div class="section-content">
            <div class="skills-list">
              ${(skills || '').split(',').map(skill => `<span class="skill-tag">${skill.trim()}</span>`).join('')}
            </div>
          </div>
        </section>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);

    const filename = `CV-${fullName.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
    const filePath = path.join('/app/output', filename);

    await page.pdf({ 
      path: filePath, 
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' }
    });
    await browser.close();

    console.log(`✅ PDF Saved: ${filename}`);
    return { success: true, filename };

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
});