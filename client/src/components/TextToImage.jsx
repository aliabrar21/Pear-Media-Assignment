import React, { useState } from 'react';
import axios from 'axios';
import { Wand2, Image as ImageIcon, Sparkles, Download } from 'lucide-react';
import Spinner from './Spinner';

const TextToImage = () => {
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1 = input, 2 = enhanced, 3 = generated

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_URL}/enhance-text`, { prompt });
      setEnhancedPrompt(data.enhancedPrompt);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enhance prompt. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    const finalPrompt = step === 2 ? enhancedPrompt : prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.post(`${API_URL}/generate-image`, { prompt: finalPrompt });
      setImages([data.imageUrl, ...images]); // Prepend new image
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate image. Ensure API keys are valid.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to force download image bypassing CORS (via fetch)
  const downloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="fade-in glass-panel">
      <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Wand2 className="accent-icon" color="var(--accent-color)" /> Text to Image Workspace
      </h2>

      {/* Input Section */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          What would you like to create?
        </label>
        <textarea 
          className="input-field" 
          rows="4"
          placeholder="e.g. A futuristic city skyline at sunset with flying cars..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button 
            className="btn" 
            onClick={handleEnhance} 
            disabled={!prompt.trim() || loading || step === 2}
          >
            {loading && step === 1 ? <Spinner /> : <Sparkles size={18} />} 
            Enhance Prompt
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || loading}
          >
            {loading && step !== 1 ? <Spinner /> : <ImageIcon size={18} />} 
            {step === 2 ? 'Approve & Generate Image' : 'Generate Directly'}
          </button>
        </div>
      </div>

      {/* Validation/Error Messages */}
      {error && (
        <div className="error-message">
           <strong>Error:</strong> {error}
        </div>
      )}

      {/* Enhanced Prompt Review Section */}
      {step >= 2 && (
        <div className="fade-in" style={{ marginTop: '32px', padding: '16px', background: 'rgba(123, 66, 246, 0.1)', borderRadius: 'var(--border-radius-md)' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--accent-color)' }}>✨ Enhanced Prompt</h3>
          <textarea 
            className="input-field" 
            rows="5"
            value={enhancedPrompt}
            onChange={(e) => setEnhancedPrompt(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {/* Generated Images Grid */}
      {images.length > 0 && (
        <div className="fade-in" style={{ marginTop: '48px' }}>
          <h3>Gallery ({images.length})</h3>
          <div className="image-grid">
            {images.map((url, idx) => (
              <div key={idx} className="image-card">
                <img src={url} alt="Generated UI Output" />
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', position: 'absolute', bottom: 0, width: '100%' }}>
                  <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Result {images.length - idx}</span>
                  <button 
                    onClick={() => downloadImage(url)} 
                    style={{ background: 'var(--accent-color)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToImage;
