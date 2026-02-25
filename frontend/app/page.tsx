"use client";

import React, { useState, useEffect, FormEvent } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });
  const [status, setStatus] = useState('');
  const [files, setFiles] = useState<any[]>([]);

  // 1. Define fetchFiles HERE, at the top level of the component
  const fetchFiles = async () => {
    try {
      const res = await fetch('http://192.168.100.53:3001/list-cvs');
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files');
    }
  };

  // 2. Call fetchFiles inside useEffect
  useEffect(() => {
    fetchFiles();
  }, []); // Empty array means run once on load

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Sending request...');

    try {
      const res = await fetch('http://192.168.100.53:3001/create-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setStatus(data.message);

      // 3. Call fetchFiles here (Now it works!)
      setTimeout(() => {
        fetchFiles();
      }, 3000);
    } catch (err) {
      setStatus('Error connecting to API');
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Create your CV</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Full Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <div>
          <label>Job Title:</label>
          <input
            type='text'
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <button type='submit' style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>
          Generate CV
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', border: '1px solid #ddd' }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Download Your CVs:</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {files.map((file, index) => (
          <li key={index} style={{ marginBottom: '10px' }}>
            <a
              href={file.url}
              download
              style={{ color: '#0070f3', textDecoration: 'underline' }}
            >
              📄 {file.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}