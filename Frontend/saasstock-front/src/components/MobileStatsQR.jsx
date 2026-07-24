import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MobileStatsQR() {
  // Ahora apunta específicamente a la vista que gatilla el PDF
  const statsUrl = `${window.location.origin}/stats/download`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col items-center text-center shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <h4 className="text-white font-bold text-sm tracking-wide">
          Descarga tus estadísticas
        </h4>
      </div>

      {/* Fondo blanco para garantizar legibilidad */}
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