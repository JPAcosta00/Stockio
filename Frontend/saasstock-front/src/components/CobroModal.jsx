import { useState, useEffect, useRef } from 'react';
import { X, Calculator, CreditCard, DollarSign } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout';

export default function CobroModal({ isOpen, onClose, totalVenta, onConfirmarVenta, enviando }) {
  const [montoRecibido, setMontoRecibido] = useState('');
  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const inputRef = useRef(null);
  const { showAlert } = useAlert();
  const { darkMode } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setMontoRecibido('');
      setMedioPago('EFECTIVO');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const recibido = parseFloat(montoRecibido) || 0;
  const vuelto = recibido - totalVenta;
  const esEfectivo = medioPago === 'EFECTIVO';
  const pagoInsuficiente = esEfectivo && recibido < totalVenta;

  const handleQuickAmount = (monto) => {
    setMontoRecibido(monto.toString());
  };

  const handleExacto = () => {
    setMontoRecibido(totalVenta.toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pagoInsuficiente) {
      showAlert('El monto recibido es menor al total de la venta', 'error');
      return;
    }

    onConfirmarVenta({
      montoRecibido: esEfectivo ? recibido : totalVenta,
      vuelto: esEfectivo && vuelto > 0 ? vuelto : 0,
      medioPago
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className={`border rounded-2xl w-full max-w-sm max-h-[90vh] shadow-2xl overflow-y-auto flex flex-col transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Cabecera */}
        <div className={`p-3.5 sm:p-4 border-b flex justify-between items-center sticky top-z-10 backdrop-blur-md ${darkMode ? 'border-zinc-800 bg-zinc-900/9ributed' : 'border-slate-200 bg-white/90'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 sm:p-2 rounded-xl ${darkMode ? 'bg-zinc-800 text-[#5BA535]' : 'bg-slate-100 text-[#5BA535]'}`}>
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Calculadora de Cobro</h3>
              <p className={`text-[10px] sm:text-xs font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Seleccioná medio de pago y calculá el vuelto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
              darkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 space-y-3 sm:space-y-4">
          
          {/* Tarjeta de Total */}
          <div className={`border rounded-xl p-3 text-center space-y-0.5 transition-colors ${
            darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Total a Cobrar</span>
            <p className={`text-2xl sm:text-3xl font-mono font-black ${darkMode ? 'text-[#5BA535]' : 'text-emerald-600'}`}>
              ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Selector de Medio de Pago */}
          <div>
            <label className={`block text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Medio de Pago</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'EFECTIVO', label: '💵 Efectivo' },
                { id: 'TRANSFERENCIA', label: '📱 Transferencia / MP' },
                { id: 'DEBITO', label: '💳 Débito' },
                { id: 'CREDITO', label: '💳 Crédito' },
              ].map(med => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => setMedioPago(med.id)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                    medioPago === med.id
                      ? darkMode 
                        ? 'bg-zinc-800 border-[#5BA535] text-white shadow-sm border-l-4 border-l-[#5BA535]' 
                        : 'bg-slate-100 border-[#5BA535] text-slate-900 shadow-sm border-l-4 border-l-[#5BA535]'
                      : darkMode 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {med.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sección exclusiva para Efectivo */}
          {esEfectivo && (
            <div className="space-y-2.5 pt-0.5">
              
              {/* Input Monto Recibido */}
              <div>
                <label className={`block text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Paga con ($):</label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-2.5 text-xs sm:text-sm font-mono font-bold ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className={`w-full border rounded-xl pl-7 pr-3 py-2 text-base sm:text-lg font-mono focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 transition-all ${
                      darkMode 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Botones de Atajo (Billetes comunes) */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={handleExacto}
                  className={`px-2.5 py-1 border text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                    darkMode 
                      ? 'bg-[#1C562A]/40 hover:bg-[#1C562A]/60 text-[#5BA535] border-[#5BA535]/30' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  Exacto
                </button>
                {[1000, 2000, 5000, 10000, 20000].map(monto => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => handleQuickAmount(monto)}
                    className={`px-2 py-1 border text-[11px] sm:text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
                      darkMode 
                        ? 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300' 
                        : 'bg-slate-50 hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                  >
                    +${monto.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>

              {/* Display de Vuelto / Alerta */}
              <div className={`p-2.5 sm:p-3 rounded-xl border flex justify-between items-center transition-all ${
                pagoInsuficiente 
                  ? 'bg-red-950/30 border-red-900/50 text-red-400' 
                  : darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  {pagoInsuficiente ? '⚠️ Falta abonar' : '💵 Vuelto a Entregar'}
                </span>
                <span className={`text-base sm:text-lg font-mono font-bold ${
                  pagoInsuficiente ? 'text-red-400' : darkMode ? 'text-[#5BA535]' : 'text-emerald-600'
                }`}>
                  ${Math.abs(vuelto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className={`pt-2 flex gap-2.5 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className={`w-1/3 font-bold py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm ${
                darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || pagoInsuficiente}
              className="w-2/3 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-[#1C562A]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {enviando ? '⏳ Finalizando...' : '⚡ Finalizar y Registrar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}