import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentQRCodeProps {
  studentId: string;
  name: string;
  institute?: string;
  events?: string[];
  foodPreference?: string;
  size?: number;
  className?: string;
}

export const StudentQRCode: React.FC<StudentQRCodeProps> = ({
  studentId,
  name,
  institute = 'SAGS Affiliated School',
  events = [],
  foodPreference = 'Veg',
  size = 120,
  className = ''
}) => {
  // Verifiable QR pass payload token
  const qrData = JSON.stringify({
    app: 'CROSSFIRE-2026',
    pass_id: studentId,
    name,
    institute,
    events,
    food: foodPreference,
    auth_host: 'srusti.edu.in',
    ts: 1763179200
  });

  return (
    <div className={`flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-inner border border-gray-200 ${className}`}>
      <QRCodeSVG
        value={qrData}
        size={size}
        level="M"
        includeMargin={true}
        fgColor="#0A192F"
        bgColor="#FFFFFF"
      />
    </div>
  );
};
