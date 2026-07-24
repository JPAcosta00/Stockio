// src/pages/StatsDownloadPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { StatsPDFDocument } from '../components/StatsPDFDocument';

const StatsDownloadPage = () => {
  const location = useLocation();
  const [status, setStatus] = useState('Generando PDF...');

  useEffect(() => {
    const handleAutoDownload = async () => {
      try {
        // 1. Intentar obtener datos desde los query params de la URL (?data=...)
        const searchParams = new URLSearchParams(location.search);
        const rawData = searchParams.get('data');
        
        let statsData = null;

        if (rawData) {
          statsData = JSON.parse(decodeURIComponent(rawData));
        } else {
          // Fallback por si viniera por el estado de React Router
          statsData = location.state?.statsData;
        }

        if (!statsData) {
          setStatus('No se encontraron datos para generar el reporte.');
          return;
        }

        // 2. Generar el blob del PDF en memoria en el celular
        const blob = await pdf(<StatsPDFDocument data={statsData} />).toBlob();

        // 3. Crear un enlace invisible y simular clic para iniciar la descarga automáticamente
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_saasstock_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Limpieza de memoria
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setStatus('¡Descarga completada!');
      } catch (error) {
        console.error('Error al generar el PDF:', error);
        setStatus('Ocurrió un error al generar el archivo.');
      }
    };

    handleAutoDownload();
  }, [location]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.25rem' }}>SaaSStock</h2>
        <p style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1rem' }}>{status}</p>
      </div>
    </div>
  );
};

export default StatsDownloadPage;