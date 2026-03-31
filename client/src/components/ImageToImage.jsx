import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Image as ImageIcon, FileSearch, Layers } from 'lucide-react';
import Spinner from './Spinner';

const ImageToImage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingType, setLoadingType] = useState(null); // 'analyze' or 'variation'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [variations, setVariations] = useState([]);
  const [error, setError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setupFile(e.target.files[0]);
    }
  };

  const setupFile = (selectedFile) => {
    // Basic validation
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setAnalysisResult(null);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoadingType('analyze');
    setError(null);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await axios.post(`${API_URL}/analyze-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Check backend configuration.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleVariations = async () => {
    if (!file) return;

    setLoadingType('variation');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await axios.post(`${API_URL}/generate-variations`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVariations([data.imageUrl, ...variations]);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Remember that OpenAI requires a square PNG under 4MB.');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="fade-in glass-panel">
      <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ImageIcon className="accent-icon" color="var(--accent-color)" /> Image to Image Workspace
      </h2>

      {/* Drag & Drop Zone */}
      {!preview ? (
        <div 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="dropzone-icon" />
          <h3>Drag & Drop your image here</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            or click to browse from your computer (PNG Square format recommended)
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Selected Image Column */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ position: 'relative', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
              <img src={preview} alt="Selected preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
              <button 
                onClick={() => { setFile(null); setPreview(null); setAnalysisResult(null); }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}
              >
                Change Image
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button 
                className="btn" 
                onClick={handleAnalyze} 
                disabled={loadingType !== null}
                style={{ flex: 1 }}
              >
                {loadingType === 'analyze' ? <Spinner /> : <FileSearch size={18} />} 
                Analyze Image
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={handleVariations} 
                disabled={loadingType !== null}
                style={{ flex: 1 }}
              >
                {loadingType === 'variation' ? <Spinner /> : <Layers size={18} />} 
                Get Variations
              </button>
            </div>

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Results Column */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            {analysisResult && (
              <div className="fade-in glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--accent-hover)' }}>Analysis Results</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>Caption</h4>
                  <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    {analysisResult.caption}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>Detected Objects</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {analysisResult.objects?.map((obj, i) => (
                      <span key={i} className="badge">{obj}</span>
                    ))}
                    {(!analysisResult.objects || analysisResult.objects.length === 0) && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No specific objects distinctively listed</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variations Grid */}
      {variations.length > 0 && (
        <div className="fade-in" style={{ marginTop: '48px' }}>
          <h3>Generated Variations</h3>
          <div className="image-grid">
            {variations.map((url, idx) => (
              <div key={idx} className="image-card">
                <img src={url} alt={`Variation ${idx}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToImage;
