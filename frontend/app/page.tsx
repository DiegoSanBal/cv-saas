"use client";

import { useState, useEffect, FormEvent } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
  });
  const [status, setStatus] = useState('');
  const [files, setFiles] = useState<any[]>([]);

  const fetchFiles = async () => {
    try {
      const res = await fetch('http://192.168.100.53:3001/list-cvs');
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Generating professional CV...');

    try {
      const res = await fetch('http://192.168.100.53:3001/create-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setStatus(data.message);
      
      setTimeout(() => fetchFiles(), 4000); // Give worker time to generate
    } catch (err) {
      setStatus('Error connecting to API');
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Professional CV Builder</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Fill out the details below. We will format it into a high-yield ATS template.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        {/* Header Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Full Name</label>
            <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required style={{ width: '100%', padding: '10px' }} />
          </div>
          <div>
            <label>Job Title</label>
            <input type="text" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} required style={{ width: '100%', padding: '10px' }} />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '10px' }} />
          </div>
          <div>
            <label>Phone</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required style={{ width: '100%', padding: '10px' }} />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label>Professional Summary (2-3 sentences)</label>
          <textarea 
            value={formData.summary} 
            onChange={e => setFormData({...formData, summary: e.target.value})} 
            rows={3} 
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        {/* Experience */}
        <div>
          <label>Experience (One job per line. Format: Job Title @ Company | Dates)</label>
          <textarea 
            value={formData.experience} 
            onChange={e => setFormData({...formData, experience: e.target.value})} 
            rows={4} 
            placeholder="Senior Developer @ Tech Corp | 2020-Present&#10;Junior Dev @ Startup | 2018-2020"
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        {/* Education */}
        <div>
          <label>Education (One degree per line)</label>
          <textarea 
            value={formData.education} 
            onChange={e => setFormData({...formData, education: e.target.value})} 
            rows={2} 
            placeholder="BS Computer Science, University X | 2018"
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        {/* Skills */}
        <div>
          <label>Skills (Comma separated)</label>
          <textarea 
            value={formData.skills} 
            onChange={e => setFormData({...formData, skills: e.target.value})} 
            rows={2} 
            placeholder="JavaScript, Docker, React, PostgreSQL, AWS"
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <button type="submit" style={{ padding: '15px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
          Generate Professional CV
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
          {status}
        </div>
      )}

      <h2 style={{ marginTop: '3rem' }}>Your CVs:</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {files.map((file, i) => (
          <li key={i} style={{ marginBottom: '10px' }}>
            <a href={file.url} download style={{ color: '#2563eb', fontWeight: 'bold' }}>
              ⬇️ {file.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}