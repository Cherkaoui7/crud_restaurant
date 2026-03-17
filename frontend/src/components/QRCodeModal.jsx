import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function QRCodeModal({ show, onClose, publicUrl }) {
  const qrRef = useRef(null);

  if (!show) return null;

  const handleDownload = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'restaurant-menu-qr.png';
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content overflow-hidden border-0 shadow">
          {/* Header */}
          <div className="modal-header bg-light border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">Menu QR Code</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body text-center py-5">
            <p className="text-secondary mb-4">Print this QR code and place it on your tables. Customers can scan it to view your menu instantly.</p>
            
            <div className="d-inline-block p-3 bg-white border rounded shadow-sm" ref={qrRef}>
              <QRCodeSVG 
                value={publicUrl} 
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="mt-4">
              <a href={publicUrl} target="_blank" rel="noreferrer" className="text-decoration-none small text-primary d-block mb-3">
                {publicUrl}
              </a>
              <button className="btn btn-dark rounded-pill px-4" onClick={handleDownload}>
                <i className="bi bi-download me-2"></i>
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
