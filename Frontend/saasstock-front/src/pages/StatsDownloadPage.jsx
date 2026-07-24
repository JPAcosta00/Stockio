// src/pages/StatsDownloadPage.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StatsPDFDocument } from '../components/StatsPDFDocument';

export const StatsDownloadPage = () => {
  const location = useLocation();

  // Tomamos la información directamente del estado de la ruta enviada desde la vista anterior
  const statsData = location.state?.statsData;

  // Si no hay datos en memoria (ej. el usuario entró pegando la URL directamente)
  if (!statsData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>No hay datos disponibles para exportar</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Para generar un reporte, navega desde el panel principal de estadísticas.
        </p>
        <Link 
          to="/stats" 
          style={{ 
            color: '#2563eb', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            border: '1px solid #2563eb',
            padding: '8px 16px',
            borderRadius: '6px'
          }}
        >
          Volver a Estadísticas
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Reporte Listo para Descargar</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem', textAlign: 'center', maxWidth: '400px' }}>
        El documento PDF ha sido construido en tiempo real con la información actual de tu pantalla.
      </p>

      <PDFDownloadLink
        document={<StatsPDFDocument data={statsData} />}
        fileName={`reporte_saasstock_${new Date().toISOString().slice(0, 10)}.pdf`}
        style={{
          textDecoration: 'none',
          padding: '12px 24px',
          color: '#ffffff',
          backgroundColor: '#2563eb',
          borderRadius: '6px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
          transition: 'background-color 0.2s'
        }}
      >
        {({ loading }) =>
          loading ? 'Procesando PDF en el navegador...' : 'Descargar Reporte PDF'
        }
      </PDFDownloadLink>
    </div>
  );
};