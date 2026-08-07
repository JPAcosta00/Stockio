import React, { useState, useEffect, useRef } from 'react';

export default function CobroModal({ isOpen, onClose, totalVenta, onConfirmarVenta, enviando }) {
  const [montoRecibido, setMontoRecibido] = useState('');
  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const inputRef = useRef(null);

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
    if (pagoInsuficiente) return;

    onConfirmarVenta({
      montoRecibido: esEfectivo ? recibido : totalVenta,
      vuelto: esEfectivo && vuelto > 0 ? vuelto : 0,
      medioPago
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider">Calculadora de Cobro</h3>
            <p className="text-xs text-zinc-400 font-medium">Seleccioná medio de pago y calculá el vuelto</p>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-bold disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Tarjeta de Total */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total a Cobrar</span>
            <p className="text-3xl font-mono font-black text-[#5BA535]">
              ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Selector de Medio de Pago */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Medio de Pago</label>
            <div className="grid grid-cols-2 gap-2">
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    medioPago === med.id
                      ? 'bg-zinc-800 border-[#5BA535] text-white shadow-sm border-l-2 border-l-[#5BA535]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {med.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sección exclusiva para Efectivo */}
          {esEfectivo && (
            <div className="space-y-3 pt-1">
              
              {/* Input Monto Recibido */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Paga con ($):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-zinc-500 text-sm font-mono font-bold">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-lg text-zinc-100 font-mono focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 transition-all"
                  />
                </div>
              </div>

              {/* Botones de Atajo (Billetes comunes) */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleExacto}
                  className="px-3 py-1.5 bg-[#1C562A]/40 hover:bg-[#1C562A]/60 text-[#5BA535] border border-[#5BA535]/30 text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  Exacto
                </button>
                {[1000, 2000, 5000, 10000, 20000].map(monto => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => handleQuickAmount(monto)}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono font-semibold rounded-lg transition-colors"
                  >
                    +${monto.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>

              {/* Display de Vuelto / Alerta */}
              <div className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                pagoInsuficiente 
                  ? 'bg-red-950/30 border-red-900/50 text-red-400' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-200'
              }`}>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {pagoInsuficiente ? '⚠️ Falta abonar' : '💵 Vuelto a Entregar'}
                </span>
                <span className={`text-xl font-mono font-bold ${
                  pagoInsuficiente ? 'text-red-400' : 'text-[#5BA535]'
                }`}>
                  ${Math.abs(vuelto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || pagoInsuficiente}
              className="w-2/3 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-[#1C562A]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? '⏳ Finalizando...' : '⚡ Finalizar y Registrar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}