import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export default function Caja() {
  // Estado general de la caja
  const [cajaActiva, setCajaActiva] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [montoInicialInput, setMontoInicialInput] = useState('');

  // Estado para el Arqueo al intentar cerrar
  const [efectivoRealContado, setEfectivoRealContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  // 1. Cargar el estado actual de la caja al montar el componente
  useEffect(() => {
    obtenerEstadoCaja();
  }, []);

  const obtenerEstadoCaja = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/caja/activa');
      setCajaActiva(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setCajaActiva(null); // No hay caja abierta
      } else {
        console.error("Error al obtener la caja activa:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejo de Apertura
  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    const monto = Number(montoInicialInput);
    if (monto < 0) return alert("El monto inicial debe ser mayor o igual a 0");

    try {
      const response = await apiClient.post(`/caja/abrir?montoDeInicio=${monto}`);
      setCajaActiva(response.data);
      setMontoInicialInput('');
    } catch (error) {
      alert(error.response?.data?.mensaje || "Error al abrir la caja");
    }
  };

  // 3. Manejo de Cierre / Arqueo 
  const handleCerrarCajaSubmit = async (e) => {
    e.preventDefault();
    
    if (!cajaActiva) return;

    const datosCierre = {
      cajaId: cajaActiva.id,
      efectivoRealContado: Number(efectivoRealContado),
      observaciones: observaciones
    };

    try {
      const response = await apiClient.post('/caja/cerrar', datosCierre);
      alert(`Caja cerrada con éxito. Diferencia registrada: $${response.data.diferencia.toFixed(2)}`);
      
      // Resetear estados
      setCajaActiva(null);
      setMostrarModalCierre(false);
      setEfectivoRealContado('');
      setObservaciones('');
    } catch (error) {
      alert(error.response?.data?.mensaje || "Error al cerrar la caja");
    }
  };

  // 4. Generación de Reporte PDF
  const handleGenerarReportePDF = async () => {
    try {
      const response = await apiClient.get('/caja/reporte-pdf?algunDato=test', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CierreCaja_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error al generar el reporte PDF:", error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-zinc-400 font-mono">Cargando estado de la caja...</div>;
  }

  const cajaAbierta = !!cajaActiva;

  // Valores calculados desde el DTO que viene del backend
  const efectivoEsperado = cajaActiva?.efectivoEsperado || 0;
  const diferenciaEfectivo = (Number(efectivoRealContado) || 0) - efectivoEsperado;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-zinc-100">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Caja</h1>
          <p className="text-sm text-zinc-400">Apertura, control de movimientos y arqueo de turno</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cajaAbierta ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {cajaAbierta ? '● CAJA ABIERTA' : '○ CAJA CERRADA'}
          </span>

          <button 
            onClick={handleGenerarReportePDF}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            📄 Generar Reporte PDF
          </button>
        </div>
      </div>

      {/* FORMULARIO APERTURA */}
      {!cajaAbierta ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md mx-auto text-center shadow-xl">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
            💵
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Abrir Turno de Caja</h2>
          <p className="text-sm text-zinc-400 mb-6">Ingresa el monto de cambio inicial guardado en el cajón.</p>
          
          <form onSubmit={handleAbrirCaja} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Monto Inicial ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={montoInicialInput}
                onChange={(e) => setMontoInicialInput(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              Iniciar Turno / Abrir Caja
            </button>
          </form>
        </div>
      ) : (

        /* PANEL DE CAJA ABIERTA (Muestra datos directos del Backend) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Fondo Inicial</span>
              <p className="text-xl font-bold text-white font-mono mt-1">${cajaActiva.montoInicial?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-emerald-400 uppercase">Ventas Efectivo</span>
              <p className="text-xl font-bold text-white font-mono mt-1">${cajaActiva.ventasEfectivo?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-sky-400 uppercase">Mercado Pago</span>
              <p className="text-xl font-bold text-white font-mono mt-1">${cajaActiva.ventasMercadoPago?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-purple-400 uppercase">Tarjetas</span>
              <p className="text-xl font-bold text-white font-mono mt-1">${cajaActiva.ventasTarjeta?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Resumen de Efectivo en Cajón</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm font-mono bg-zinc-950 p-4 rounded-lg border border-zinc-800/80 mb-6">
              <div>
                <span className="text-zinc-500 block text-xs">MONTO INICIAL</span>
                <span className="text-white font-bold">${cajaActiva.montoInicial?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-emerald-500 block text-xs">(+) VENTAS EFECTIVO</span>
                <span className="text-white font-bold">+${cajaActiva.ventasEfectivo?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-emerald-500 block text-xs">(+) INGRESOS EXTRA</span>
                <span className="text-white font-bold">+${cajaActiva.montoIngresosExtra?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-rose-500 block text-xs">(-) EGRESOS EXTRA</span>
                <span className="text-white font-bold">-${cajaActiva.montoEgresosExtra?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase">Efectivo Esperado a la Salida</span>
                <p className="text-2xl font-bold text-emerald-300 font-mono">${cajaActiva.efectivoEsperado?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              </div>

              <button
                onClick={() => setMostrarModalCierre(true)}
                className="mt-4 sm:mt-0 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Hacer Arqueo y Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ARQUEO Y CIERRE */}
      {mostrarModalCierre && cajaActiva && (
        <div 
          onClick={() => setMostrarModalCierre(false)}
          className="fixed top-0 left-0 w-screen min-h-screen bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 relative shadow-2xl space-y-6"
          >
            <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-3">Arqueo y Cierre de Caja</h3>

            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Efectivo Calculado (Esperado):</span>
                <span className="text-white font-bold">${efectivoEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Mercado Pago:</span>
                <span className="text-white font-bold">${cajaActiva.ventasMercadoPago?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Tarjetas:</span>
                <span className="text-white font-bold">${cajaActiva.ventasTarjeta?.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCerrarCajaSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Efectivo Real Contado en Cajón ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ingrese el monto físico total"
                  value={efectivoRealContado}
                  onChange={(e) => setEfectivoRealContado(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Observaciones (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Faltó cambio / Retiro de efectivo..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm focus:outline-none"
                />
              </div>

              {/* MUESTRA SOBRANTE / FALTANTE EN TIEMPO REAL */}
              {efectivoRealContado !== '' && (
                <div className={`p-3 rounded-lg font-mono text-sm border flex justify-between items-center ${diferenciaEfectivo === 0 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : diferenciaEfectivo > 0 ? 'bg-blue-950/40 border-blue-500/30 text-blue-400' : 'bg-rose-950/40 border-rose-500/30 text-rose-400'}`}>
                  <span>
                    {diferenciaEfectivo === 0 && 'Caja Cuadrada Perfecta'}
                    {diferenciaEfectivo > 0 && 'Sobrante de Caja:'}
                    {diferenciaEfectivo < 0 && 'Faltante de Caja:'}
                  </span>
                  <span className="font-bold text-base">
                    ${Math.abs(diferenciaEfectivo).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalCierre(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-rose-900/20"
                >
                  Confirmar y Cerrar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}