import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout'; 
import { Loader2, PlusCircle, MinusCircle, FileText, DollarSign, TrendingUp, CreditCard, Banknote, X, AlertCircle, Calendar } from 'lucide-react';

export default function Caja() {
  const { showAlert } = useAlert();
  const { darkMode } = useTheme();

  // Estado general de la caja
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [montoInicialInput, setMontoInicialInput] = useState('');

  // Estado para el Arqueo al intentar cerrar
  const [efectivoRealContado, setEfectivoRealContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  // Nuevos estados para confirmación y carga del cierre
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [cerrandoCaja, setCerrandoCaja] = useState(false);

  // Estado para Registro de Movimientos Extras (Gastos / Retiros / Ingresos)
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState('EGRESO');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [conceptoMovimiento, setConceptoMovimiento] = useState('');
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);

  // Estados para el Modal de Reporte Histórico
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().split('T')[0]);
  const [generandoReporte, setGenerandoReporte] = useState(false);

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
    if (monto < 0) {
      showAlert("El monto inicial debe ser mayor o igual a 0", "warning");
      return;
    }

    try {
      const response = await apiClient.post('/caja/abrir', { montoDeInicio: monto });
      setCajaActiva(response.data);
      setMontoInicialInput('');
      showAlert("Caja abierta exitosamente", "success");
    } catch (error) {
      showAlert(error.response?.data?.mensaje || "Error al abrir la caja", "error");
    }
  };

  // Registrar Movimiento (Ingreso / Egreso / Gasto)
  const handleRegistrarMovimientoSubmit = async (e) => {
    e.preventDefault();
    const monto = Number(montoMovimiento);

    if (!monto || monto <= 0) {
      showAlert("El monto debe ser un número positivo mayor a 0.", "warning");
      return;
    }
    if (!conceptoMovimiento.trim()) {
      showAlert("Debe ingresar un concepto para la transacción.", "warning");
      return;
    }

    try {
      setGuardandoMovimiento(true);

      const payload = {
        cajaId: cajaActiva.id,
        tipo: tipoMovimiento,
        monto: monto,
        concepto: conceptoMovimiento.trim()
      };

      await apiClient.post('/caja/movimientos', payload);

      setMontoMovimiento('');
      setConceptoMovimiento('');
      setTipoMovimiento('EGRESO');
      setMostrarModalMovimiento(false);

      await obtenerEstadoCaja();
      showAlert("Movimiento registrado correctamente", "success");
    } catch (error) {
      showAlert(error.response?.data?.mensaje || "Error al registrar el movimiento.", "error");
    } finally {
      setGuardandoMovimiento(false);
    }
  };

  const handlePrepararCierre = (e) => {
    e.preventDefault();
    if (efectivoRealContado === '' || Number(efectivoRealContado) < 0) {
      showAlert("Ingrese un monto válido de efectivo contado.", "warning");
      return;
    }
    setConfirmandoCierre(true);
  };

  // 4. Manejo de Cierre / Arqueo Definitivo
  const handleCerrarCajaSubmit = async () => {
    if (!cajaActiva) return;

    const datosCierre = {
      cajaId: cajaActiva.id,
      efectivoRealContado: Number(efectivoRealContado),
      observaciones: observaciones
    };

    try {
      setCerrandoCaja(true);
      await apiClient.post('/caja/cerrar', datosCierre);

      setCajaActiva(null);
      setMostrarModalCierre(false);
      setConfirmandoCierre(false);
      setEfectivoRealContado('');
      setObservaciones('');
      showAlert("Caja cerrada exitosamente", "success");
    } catch (error) {
      showAlert(error.response?.data?.mensaje || "Error al cerrar la caja", "error");
    } finally {
      setCerrandoCaja(false);
    }
  };

  const handleCerrarModalCierre = () => {
    setMostrarModalCierre(false);
    setConfirmandoCierre(false);
  };

  // 5. Generación de Reporte PDF (Soporta fecha específica)
  const handleGenerarReportePDFSubmit = async (e) => {
    e.preventDefault();
    try {
      setGenerandoReporte(true);
      const response = await apiClient.get(`/caja/reporte-pdf?fecha=${fechaReporte}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CierreCaja_${fechaReporte}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setMostrarModalReporte(false);
      showAlert("Reporte PDF generado con éxito", "success");
    } catch (error) {
      console.error("Error al generar el reporte PDF:", error);
      showAlert(error.response?.data?.mensaje || "No se encontró caja o reporte para la fecha seleccionada.", "error");
    } finally {
      setGenerandoReporte(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex h-96 items-center justify-center gap-3 rounded-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-200 text-slate-500'}`}>
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="text-sm font-medium">Cargando estado de la caja...</span>
      </div>
    );
  }

  const cajaAbierta = !!cajaActiva;
  const efectivoEsperado = cajaActiva?.efectivoEsperado || 0;
  const diferenciaEfectivo = (Number(efectivoRealContado) || 0) - efectivoEsperado;

  // Mapeo correcto directo desde el JSON que devuelve el backend
  const ingresosExtraVal = cajaActiva?.montoIngresosExtra ?? 0;
  const egresosExtraVal = cajaActiva?.montoEgresosExtra ?? 0;

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* CABECERA */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl border transition-colors shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Gestión de Caja</h1>
          <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Apertura, control de movimientos y arqueo de turno</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 ${cajaAbierta ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {cajaAbierta ? <div className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></div> : <div className='w-2 h-2 rounded-full bg-rose-500'></div>}
            {cajaAbierta ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarModalReporte(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
            >
              <FileText className="w-4 h-4" />
              <span>Generar Reporte PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* FORMULARIO APERTURA */}
      {!cajaAbierta ? (
        <div className={`border rounded-2xl p-10 max-w-lg mx-auto text-center shadow-xl transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Banknote className="w-8 h-8" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Abrir Turno de Caja</h2>
          <p className={`text-sm mb-8 max-w-sm mx-auto ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Ingresa el monto de dinero inicial (fondo de cambio) disponible en caja para comenzar.</p>

          <form onSubmit={handleAbrirCaja} className="space-y-6">
            <div className="text-left">
              <label className={`block text-xs font-semibold uppercase mb-2 tracking-wider ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Monto Inicial de Fondo ($)</label>
              <div className="relative">
                <DollarSign className={`absolute left-4 top-3.5 w-5 h-5 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={montoInicialInput}
                  onChange={(e) => setMontoInicialInput(e.target.value)}
                  className={`w-full border rounded-xl p-4 pl-12 focus:outline-none focus:ring-1 font-mono text-xl ${
                    darkMode 
                      ? 'bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-zinc-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30 text-lg cursor-pointer"
            >
              Abrir Caja e Iniciar Turno
            </button>
          </form>
        </div>
      ) : (

        /* PANEL DE CAJA ABIERTA */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Fondo Inicial" value={cajaActiva.montoInicial} icon={Banknote} color="text-zinc-300" darkMode={darkMode} />
            <StatCard title="Ventas Efectivo" value={cajaActiva.ventasEfectivo} icon={TrendingUp} color="text-emerald-400" darkMode={darkMode} />
            <StatCard title="Mercado Pago" value={cajaActiva.ventasMercadoPago} icon={CreditCard} color="text-sky-400" darkMode={darkMode} />
            <StatCard title="Tarjetas" value={cajaActiva.ventasTarjeta} icon={CreditCard} color="text-purple-400" darkMode={darkMode} />
          </div>

          <div className={`border rounded-2xl p-4 sm:p-8 shadow-sm transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6 ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Arqueo de Efectivo en Cajón</h3>

              <button
                onClick={() => setMostrarModalMovimiento(true)}
                className="w-full sm:w-auto bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MinusCircle className="w-4 h-4 shrink-0" />
                <span>Registrar Gasto / Retiro / Ingreso Extra</span>
              </button>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono p-4 sm:p-6 rounded-xl border mb-8 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <MiniStat label="Monto Inicial" value={cajaActiva.montoInicial} color={darkMode ? "text-zinc-400" : "text-slate-600"} darkMode={darkMode} />
              <MiniStat label="Ventas Efectivo" value={cajaActiva.ventasEfectivo} color="text-emerald-500" darkMode={darkMode} />
              <MiniStat label="Ingresos Extra" value={ingresosExtraVal} color="text-emerald-500" darkMode={darkMode} />
              <MiniStat label="Egresos/Gastos" value={egresosExtraVal} color="text-rose-500" negative darkMode={darkMode} />
            </div>

            {/* SECCIÓN INFERIOR CON RESPONSIVE OPTIMIZADO PARA EL BOTÓN DE ARQUEO */}
            <div className={`flex flex-col lg:flex-row justify-between items-stretch lg:items-center border p-5 sm:p-6 rounded-2xl gap-6 transition-colors ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-center lg:text-left">
                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Efectivo Esperado en Cajón</span>
                <p className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  ${cajaActiva.efectivoEsperado?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <button
                onClick={() => setMostrarModalCierre(true)}
                className="w-full lg:w-auto bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all shadow-lg shadow-red-900/40 text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Loader2 className="w-5 h-5 shrink-0" />
                <span>Realizar Arqueo y Cerrar Caja</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECCIONAR FECHA PARA REPORTE PDF */}
      {mostrarModalReporte && (
        <div
          onClick={() => setMostrarModalReporte(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-6 transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
          >
            <div className={`flex justify-between items-center border-b pb-4 ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Calendar className="w-5 h-5 text-emerald-400" />
                Generar Reporte de Caja
              </h3>
              <button
                onClick={() => setMostrarModalReporte(false)}
                className={`cursor-pointer ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerarReportePDFSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Seleccionar Fecha de la Caja
                </label>
                <input
                  type="date"
                  required
                  value={fechaReporte}
                  onChange={(e) => setFechaReporte(e.target.value)}
                  className={`w-full border rounded-xl p-3 font-mono focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <p className={`text-[11px] mt-1.5 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Se buscará el cierre o los movimientos correspondientes a la fecha elegida.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalReporte(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generandoReporte}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generandoReporte && <Loader2 className="w-4 h-4 animate-spin" />}
                  Descargar PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR MOVIMIENTO EXTRA */}
      {mostrarModalMovimiento && (
        <div
          onClick={() => setMostrarModalMovimiento(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-6 transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
          >
            <div className={`flex justify-between items-center border-b pb-4 ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Registrar Movimiento Extra</h3>
              <button
                onClick={() => setMostrarModalMovimiento(false)}
                className={`cursor-pointer ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarMovimientoSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Tipo de Movimiento</label>
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                  className={`w-full border rounded-xl p-3 focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="EGRESO">Egreso / Gasto (Resta efectivo)</option>
                  <option value="INGRESO">Ingreso Extra (Suma efectivo)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value)}
                  className={`w-full border rounded-xl p-3 font-mono focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Concepto / Motivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de rollos de papel, pago de flete..."
                  value={conceptoMovimiento}
                  onChange={(e) => setConceptoMovimiento(e.target.value)}
                  className={`w-full border rounded-xl p-3 focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalMovimiento(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoMovimiento}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {guardandoMovimiento && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CIERRE Y ARQUEO DE CAJA */}
      {mostrarModalCierre && (
        <div
          onClick={handleCerrarModalCierre}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-6 transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
          >
            <div className={`flex justify-between items-center border-b pb-4 ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {!confirmandoCierre ? 'Arqueo de Caja - Conteo de Efectivo' : 'Confirmación de Cierre'}
              </h3>
              <button
                onClick={handleCerrarModalCierre}
                className={`cursor-pointer ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!confirmandoCierre ? (
              <form onSubmit={handlePrepararCierre} className="space-y-4">
                <div className={`p-4 rounded-xl border space-y-1 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Efectivo Esperado en Sistema:</span>
                  <p className="text-2xl font-mono font-bold text-emerald-400">
                    ${efectivoEsperado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Efectivo Real Contado en Caja ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={efectivoRealContado}
                    onChange={(e) => setEfectivoRealContado(e.target.value)}
                    className={`w-full border rounded-xl p-3 font-mono text-lg focus:outline-none focus:border-emerald-500 ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Observaciones / Motivo de diferencia (Opcional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Ej. Faltante por cambio no dado..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className={`w-full border rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-sm ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCerrarModalCierre}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    Continuar al Resumen
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className={`space-y-3 p-4 rounded-xl border text-sm font-mono ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`flex justify-between ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                    <span>Efectivo Esperado:</span>
                    <span>${efectivoEsperado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                    <span>Efectivo Contado:</span>
                    <span>${Number(efectivoRealContado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between font-bold pt-2 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-200'} ${diferenciaEfectivo < 0 ? 'text-rose-400' : diferenciaEfectivo > 0 ? 'text-emerald-400' : (darkMode ? 'text-zinc-300' : 'text-slate-700')}`}>
                    <span>Diferencia:</span>
                    <span>${diferenciaEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    Estás a punto de cerrar el turno de caja definitivamente. Esta acción registrará el arqueo y no se podrán agregar más ventas a este turno.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoCierre(false)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={cerrandoCaja}
                    onClick={handleCerrarCajaSubmit}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {cerrandoCaja && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar y Cerrar Caja
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, darkMode }) {
  return (
    <div className={`border p-6 rounded-2xl shadow-sm flex items-center justify-between transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
      <div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{title}</span>
        <p className={`text-2xl font-extrabold font-mono mt-1 ${color}`}>
          ${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-200'}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, negative, darkMode }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{label}</span>
      <p className={`text-lg font-bold font-mono mt-2 ${color}`}>
        {negative && value > 0 ? '-' : ''}${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}