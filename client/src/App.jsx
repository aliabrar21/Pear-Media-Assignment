import React, { useState } from 'react';
import TextToImage from './components/TextToImage';
import ImageToImage from './components/ImageToImage';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('text-to-image');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">AI Image & Text Generator</h1>
        
        <nav className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'text-to-image' ? 'active' : ''}`}
            onClick={() => setActiveTab('text-to-image')}
          >
            Text to Image
          </button>
          <button 
            className={`tab-btn ${activeTab === 'image-to-image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image-to-image')}
          >
            Image to Image
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'text-to-image' ? <TextToImage /> : <ImageToImage />}
      </main>
    </div>
  );
}

export default App;
