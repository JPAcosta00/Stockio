// src/pages/StatsDownloadPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { StatsPDFDocument } from '../components/StatsPDFDocument';
import axios from 'axios';

export default function StatsDownloadPage() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant');

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generatePdfPreview = async () => {
      try {
        // 1. Obtener los datos desde Render
        const API_URL = `https://saasstock-backend.onrender.com/api/stats/public-summary${tenantId ? `?tenant=${tenantId}` : ''}`;
        const response = await axios.get(API_URL);
        const statsData = response.data;

        // 2. Generar el Blob PDF
        const blob = await pdf(<StatsPDFDocument data={statsData} />).toBlob();
        const url = URL.createObjectURL(blob);
        
        setPdfUrl(url);
        setLoading(false);
      } catch (err) {
        console.error("Error al generar vista previa:", err);
        setError("No se pudieron cargar las estadísticas.");
        setLoading(false);
      }
    };

    generatePdfPreview();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-lg font-bold">Cargando previsualización...</h2>
        <p className="text-xs text-zinc-400 mt-1">Generando documento interactivo.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-400 text-sm font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-zinc-900 flex flex-col">
      {/* Barra superior con botón de descarga explícito */}
      <div className="bg-zinc-950 border-b border-zinc-800 p-3 flex justify-between items-center text-white px-4">
        <span className="text-xs font-semibold text-zinc-300">📄 Reporte de Estadísticas</span>
        <a
          href={pdfUrl}
          download="Estadisticas-SaaSStock.pdf"
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"
        >
          Guardar PDF
        </a>
      </div>

      {/* Visor nativo del navegador (iframe renderizando el PDF) */}
      <div className="flex-1 w-full h-full">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-none"
          title="Previsualización PDF"
        />
      </div>
    </div>
  );
}