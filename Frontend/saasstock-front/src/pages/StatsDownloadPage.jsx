// src/pages/StatsDownloadPage.jsx
import React, { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { StatsPDFDocument } from '../components/StatsPDFDocument';
import api from '../api/apiClient';

export default function StatsDownloadPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndDownloadPDF = async () => {
      try {
        // 1. Pedir los datos de estadísticas al backend
        const response = await api.get('/stats/summary'); // Cambiá por tu endpoint real
        const statsData = response.data;

        // 2. Generar el archivo PDF en memoria
        const blob = await pdf(<StatsPDFDocument data={statsData} />).toBlob();

        // 3. Forzar descarga en el navegador del celular
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Estadisticas-SaaSStock-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setLoading(false);
      } catch (err) {
        console.error("Error al generar PDF:", err);
        setError("No se pudieron cargar los datos de las estadísticas.");
        setLoading(false);
      }
    };

    fetchAndDownloadPDF();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full shadow-2xl">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="text-lg font-bold">Generando tu PDF...</h2>
            <p className="text-xs text-zinc-400">
              Obteniendo estadísticas. La descarga comenzará automáticamente en tu celular.
            </p>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-400 text-sm font-semibold">{error}</p>
            <p className="text-xs text-zinc-500">Asegurate de tener conexión o haber iniciado sesión.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">🎉</div>
            <h2 className="text-lg font-bold text-green-400">¡PDF Descargado!</h2>
            <p className="text-xs text-zinc-400">
              Revisá la carpeta de descargas de tu celular.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}