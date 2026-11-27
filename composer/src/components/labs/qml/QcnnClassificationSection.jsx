import React, { useState, useRef } from 'react';
import { QUANVOLUTION_IMAGE_DATASETS, createCustomImageDataset } from '../../../quantum-engine/labs/qml-engine';

async function downsampleImageTo8x8(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, 8, 8);
        const imgData = ctx.getImageData(0, 0, 8, 8).data;
        const matrix = [];
        for (let r = 0; r < 8; r++) {
          const row = [];
          for (let c = 0; c < 8; c++) {
            const idx = (r * 8 + c) * 4;
            const lum = (0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2]) / 255;
            row.push(Number(lum.toFixed(3)));
          }
          matrix.push(row);
        }
        resolve(matrix);
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function QcnnClassificationSection({
  qcnnDatasetId,
  setQcnnDatasetId,
  qcnnBatchIndex,
  setQcnnBatchIndex,
  qcnnModelResult,
  onTrainQcnn,
  isTrainingQcnn,
  quanvResult
}) {
  const fileInputRef = useRef(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const currentDataset = QUANVOLUTION_IMAGE_DATASETS[qcnnDatasetId] || QUANVOLUTION_IMAGE_DATASETS.mnist_01;
  const currentSample = currentDataset.samples[qcnnBatchIndex] || currentDataset.samples[0];

  const handleCustomImageFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsProcessingImages(true);
    setUploadStatus(`Downsampling ${files.length} images to 8×8 via canvas bilinear interpolation...`);
    try {
      const matrices = [];
      const labels = [];
      for (const file of files) {
        const matrix = await downsampleImageTo8x8(file);
        matrices.push(matrix);
        const name = file.name.toLowerCase();
        const isClass1 = name.includes('1') || name.includes('pos') || name.includes('defect') || name.includes('pneumonia') || name.includes('malignant');
        labels.push(isClass1 ? 1 : 0);
      }
      const customDataset = createCustomImageDataset(matrices, labels, `User Upload (${matrices.length} imgs)`);
      QUANVOLUTION_IMAGE_DATASETS.custom_upload = customDataset;
      setQcnnDatasetId('custom_upload');
      setQcnnBatchIndex(0);
      setUploadStatus(`✓ Successfully processed & downsampled ${matrices.length} custom images.`);
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      setUploadStatus(`⚠️ Image Processing Failed: ${err.message}`);
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  return (
    <div className="lab-card" style={{ marginTop: '1.25rem' }}>
      <div className="lab-card-header">
        <span className="lab-card-title">
          <span>🧠 QCNN Pipeline: Classical-Quantum Pooling & Dense Classification Head</span>
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--lab-text-secondary)' }}>Batch Dataset:</label>
          <select
            className="lab-select"
            value={qcnnDatasetId}
            onChange={(e) => {
              setQcnnDatasetId(e.target.value);
              setQcnnBatchIndex(0);
            }}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            {Object.entries(QUANVOLUTION_IMAGE_DATASETS).map(([id, ds]) => (
              <option key={id} value={id}>
                {ds.name} ({ds.classes[0]} vs {ds.classes[1]})
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,.png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            onChange={handleCustomImageFiles}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingImages}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '4px',
              color: '#60a5fa',
              cursor: isProcessingImages ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📁</span>
            <span>{isProcessingImages ? 'Processing...' : 'Upload Images'}</span>
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div style={{
          margin: '0 0 10px 0',
          padding: '6px 10px',
          borderRadius: '4px',
          background: uploadStatus.startsWith('⚠️') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${uploadStatus.startsWith('⚠️') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          fontSize: '0.72rem',
          color: uploadStatus.startsWith('⚠️') ? '#ef4444' : '#34d399'
        }}>
          {uploadStatus}
        </div>
      )}

      <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 12px 0' }}>
        Solves the pipeline gap: Raw pixels → 4-qubit Quanvolution (7×7) → 2×2 Max-Pooling (3×3×4 = 36 features) → Trainable Dense Layer → Binary Prediction.
      </p>

      {/* Batch Thumbnail Selector Strip */}
      <div style={{
        background: 'var(--lab-bg-subpanel)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--lab-border)',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--lab-text-muted)' }}>
            BATCH IMAGES GALLERY — Select Sample to Inspect & Predict:
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--lab-cyan)' }}>
            Selected: Sample #{qcnnBatchIndex + 1} (True: <b>{currentDataset.classes[currentSample.label]}</b>)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {currentDataset.samples.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setQcnnBatchIndex(idx)}
              style={{
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                background: idx === qcnnBatchIndex ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: idx === qcnnBatchIndex ? '2px solid #00E5FF' : '1px solid var(--lab-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 3px)',
                gridTemplateRows: 'repeat(8, 3px)',
                background: '#000',
                padding: '1px'
              }}>
                {s.data.map((row) =>
                  row.map((val, c) => (
                    <div
                      key={c}
                      style={{
                        background: `rgb(${Math.round(val * 255)}, ${Math.round(val * 255)}, ${Math.round(val * 255)})`
                      }}
                    />
                  ))
                )}
              </div>
              <span style={{
                fontSize: '0.6rem',
                color: idx === qcnnBatchIndex ? '#00E5FF' : '#8b949e',
                fontWeight: '600'
              }}>
                {currentDataset.classes[s.label]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Max-Pooling Visualization + Dense Head Classifier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left: 2x2 Max-Pooling Compression */}
        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--lab-cyan)' }}>
              🏊 2×2 Classical Max-Pooling (Dimension Reduction)
            </span>
            <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', color: 'var(--lab-emerald)' }}>
              7×7 → 3×3×4 = 36 Features
            </span>
          </div>

          <p style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)', margin: '0 0 10px 0' }}>
            Downsamples the four 7×7 quantum expectation maps into translation-invariant 3×3 feature patches for dense classification.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {quanvResult.channels.map(ch => (
              <div key={ch.id} style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--lab-border)',
                borderRadius: '4px',
                padding: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)', marginBottom: '4px' }}>
                  Pool Ch.{ch.id}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '2px',
                  height: '50px'
                }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        background: ch.id === 2 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(0, 229, 255, 0.5)',
                        borderRadius: '1px'
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '10px',
            fontSize: '0.66rem',
            color: 'var(--lab-text-secondary)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Bottleneck compression: <b>196 → 36 floats</b></span>
            <span style={{ color: 'var(--lab-cyan)' }}>✓ Avoids Overfitting</span>
          </div>
        </div>

        {/* Right: Trainable Dense Classification Head */}
        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#f59e0b' }}>
                ⚡ Trainable Dense Classification Head
              </span>
              <button
                onClick={onTrainQcnn}
                disabled={isTrainingQcnn}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: isTrainingQcnn ? 'not-allowed' : 'pointer'
                }}
              >
                {isTrainingQcnn ? 'Training Epochs...' : '⚡ Train QCNN Classifier'}
              </button>
            </div>

            {qcnnModelResult ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '4px',
                  fontSize: '0.74rem'
                }}>
                  <span>Accuracy on Batch: <b style={{ color: '#10b981' }}>{qcnnModelResult.accuracy}%</b></span>
                  <span>Final Loss: <b style={{ color: '#fbbf24' }}>{qcnnModelResult.finalLoss}</b></span>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--lab-text-secondary)', marginBottom: '3px' }}>
                    <span>Prediction on Selected Image #{qcnnBatchIndex + 1}:</span>
                    <span style={{
                      fontWeight: '700',
                      color: qcnnModelResult.predictions[qcnnBatchIndex]?.predictedLabel === currentSample.label ? '#10b981' : '#ef4444'
                    }}>
                      Class {currentDataset.classes[qcnnModelResult.predictions[qcnnBatchIndex]?.predictedLabel]} ({qcnnModelResult.predictions[qcnnBatchIndex]?.confidence}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', height: '8px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${qcnnModelResult.predictions[qcnnBatchIndex]?.confidence || 50}%`,
                      background: '#10b981'
                    }} />
                    <div style={{
                      width: `${100 - (qcnnModelResult.predictions[qcnnBatchIndex]?.confidence || 50)}%`,
                      background: 'rgba(255, 255, 255, 0.1)'
                    }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--lab-text-muted)', fontSize: '0.72rem' }}>
                Click "⚡ Train QCNN Classifier" to fit the dense layer on the extracted quantum feature maps and evaluate batch accuracy.
              </div>
            )}
          </div>

          <div style={{
            fontSize: '0.64rem',
            color: 'var(--lab-text-muted)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '6px',
            marginTop: '8px'
          }}>
            Fully differentiable hybrid backprop: dL/dW_dense + dL/dθ_quanv via Parameter-Shift Rule.
          </div>
        </div>
      </div>
    </div>
  );
}

