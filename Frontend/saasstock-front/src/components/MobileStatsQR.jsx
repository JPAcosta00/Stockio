import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MobileStatsQR({ tenantId, data }) {
  const baseUrl = `${window.location.origin}/stats/download`;

  // Codificamos los datos actuales en base64/URL para que el celular los reciba al escanear
  const encodedData = data ? encodeURIComponent(JSON.stringify(data)) : '';
  
  // Construimos la URL con tenant y los datos del reporte
  const statsUrl = `${baseUrl}?tenant=${tenantId || ''}&data=${encodedData}`;

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
          level="L" // Nivel de corrección bajo para que el QR no quede sobrecargado
          includeMargin={false}
        />
      </div>
    </div>
  );
}