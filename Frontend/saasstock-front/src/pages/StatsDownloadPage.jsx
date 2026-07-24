// src/pages/StatsDownloadPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { StatsPDFDocument } from '../components/StatsPDFDocument';
import axios from '../api/apiClient';

export default function StatsDownloadPage() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant'); // Lee el ID del QR

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const fetchAndGeneratePDF = async () => {
      try {
        // Petición pública enviando el tenant/negocio del QR
        const response = await axios.get(`https://saasstock-backend.onrender.com/api/stats/public-summary?tenant=${tenantId}`);        
        const statsData = response.data;

        // Generar Blob PDF
        const blob = await pdf(<StatsPDFDocument data={statsData} />).toBlob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        // Intento de disparo automático
        const link = document.createElement('a');
        link.href = url;
        link.download = `Estadisticas-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setLoading(false);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
        setError("No se pudieron obtener las estadísticas de este negocio.");
        setLoading(false);
      }
    };

    fetchAndGeneratePDF();
  }, [tenantId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full shadow-2xl space-y-5">
        
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="text-lg font-bold">Obteniendo tus datos...</h2>
            <p className="text-xs text-zinc-400">Generando reporte de estadísticas en PDF.</p>
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl">📄</div>
            <h2 className="text-xl font-bold text-green-400">¡Reporte Listo!</h2>
            <p className="text-xs text-zinc-400">
              Si la descarga no se inició automáticamente en tu celular, tocá el botón:
            </p>
            
            {pdfUrl && (
              <a
                href={pdfUrl}
                download="Estadisticas.pdf"
                className="w-full inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg active:scale-95"
              >
                📥 Descargar PDF
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  );
}