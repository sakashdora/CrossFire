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
  size = 120,
  className = ''
}) => {
  // A pass identifier only. Private details and permission checks stay on the server.
  const qrData = JSON.stringify({
    app: 'CROSSFIRE-2026',
    pass_id: studentId,
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
