import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MobileStatsQR({ tenantId }) {
  // Le agregamos un parámetro a la URL con el ID de tu negocio o usuario
  // Ejemplo: https://tu-app.vercel.app/stats/download?tenant=123
  const baseUrl = `${window.location.origin}/stats/download`;
  const statsUrl = tenantId ? `${baseUrl}?tenant=${tenantId}` : baseUrl;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col items-center text-center shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <h4 className="text-white font-bold text-sm tracking-wide">
          Descarga tus estadísticas
        </h4>
      </div>

      {/* QR Code */}
      <div className="bg-white p-3 rounded-lg shadow-inner mb-3 border border-zinc-200">
        <QRCodeSVG 
          value={statsUrl} 
          size={115}
          level="H"
          includeMargin={false}
        />
      </div>
    </div>
  );
}