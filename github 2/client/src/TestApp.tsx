import React from 'react';

function TestApp() {
  console.log("TestApp rendering!");
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      background: '#f0f8ff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🚀 Document Chat Application
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        ✅ React is working correctly!
      </p>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <h2>Serbian Language Support | Подршка за српски језик</h2>
        <ul style={{ textAlign: 'left' }}>
          <li>✅ Multi-format document processing</li>
          <li>✅ Serbian Cyrillic and Latin script support</li>
          <li>✅ English-Serbian translation</li>
          <li>✅ Chat memory system</li>
          <li>✅ File upload up to 100MB</li>
        </ul>
        <button 
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
          onClick={() => alert('Button works! React is functional.')}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default TestApp;