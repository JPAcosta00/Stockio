import apiClient from './apiClient'; // Importas la instancia que ya tenías

export const downloadBackup = async () => {
  // Usamos la instancia apiClient configurada, pero pedimos un 'blob' 
  // para que Axios entienda que viene un archivo y no un JSON
  const response = await apiClient.get('/backup/download', {
    responseType: 'blob', 
  });

  // Creamos la descarga
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `stockio_backup_${new Date().toISOString().slice(0, 10)}.db`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};