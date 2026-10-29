import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { downloadQrPng } from '../lib/qrDownload';

interface StudentQRCodeProps {
  studentId: string;
  name: string;
  institute?: string;
  events?: string[];
  foodPreference?: string;
  size?: number;
  className?: string;
  downloadable?: boolean;
}

export const StudentQRCode: React.FC<StudentQRCodeProps> = ({
  studentId,
  size = 120,
  className = '',
  downloadable = false,
}) => {
  const svg = useRef<SVGSVGElement>(null);
  const [error, setError] = useState('');
  // A pass identifier only. Private details and permission checks stay on the server.
  const qrData = JSON.stringify({
    app: 'CROSSFIRE-2026',
    pass_id: studentId,
  });

  if (!studentId) return <div className={`p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 ${className}`}>Your pass is not available yet. Refresh, or contact the organisers.</div>;
  return (
    <div className={`flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-inner border border-gray-200 ${className}`}>
      <QRCodeSVG
        ref={svg}
        value={qrData}
        size={size}
        level="M"
        marginSize={4}
        fgColor="#0A192F"
        bgColor="#FFFFFF"
        role="img"
        aria-label={`QR pass ${studentId}`}
      />
      {downloadable && <button type="button" onClick={event => { event.stopPropagation(); setError(''); downloadQrPng(svg.current, `crossfire-pass-${studentId}.png`).catch(cause => setError(cause instanceof Error ? cause.message : 'Download failed.')); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-orange-600"><Download className="w-3.5 h-3.5" /> Download QR</button>}
      {error && <p role="alert" className="text-[11px] text-red-700 mt-1">{error}</p>}
    </div>
  );
};
