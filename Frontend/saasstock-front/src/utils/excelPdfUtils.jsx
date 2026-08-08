import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext';

// ==========================================
// 1. IMPORTAR EXCEL (Envía el archivo crudo al backend)
// ==========================================
export const importarArchivoExcel = async (file) => {
  // Empaqueta el archivo en un FormData 
  const formData = new FormData();
  formData.append('file', file); 

  const response = await apiClient.post('/products/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data' 
    }
  });

  return response.data; // Retorna el mensaje y el objeto "Report" 
};

// ==========================================
// 2. EXPORTAR A EXCEL (GET con QueryParams)
// ==========================================
export const exportarAExcel = async (filtros) => {
  try {
    const response = await apiClient.get('/products/export-excel', {
      params: filtros, // .NET lo recibe mapeado en ProductReportFilterDto
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ReporteProductos_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    showAlert("No se pudo generar el archivo Excel desde el servidor.", "error");
  }
};

// ==========================================
// 3. EXPORTAR A PDF (GET con QueryParams)
// ==========================================
export const exportarAPDF = async (filtros) => {
  try {
    const response = await apiClient.get('/products/export-pdf', {
      params: filtros,
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ReporteProductos_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();

    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al exportar PDF:", error);
    showAlert("No se pudo generar el archivo PDF desde el servidor.", "error");
  }
};