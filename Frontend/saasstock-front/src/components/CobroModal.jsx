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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wider">Calculadora de Cobro</h3>
            <p className="text-xs text-zinc-400">Seleccioná medio de pago y calculá el vuelto</p>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-zinc-500 hover:text-zinc-300 text-lg p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Tarjeta de Total */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total a Cobrar</span>
            <p className="text-3xl font-mono font-black text-emerald-400">
              ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Selector de Medio de Pago */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Medio de Pago</label>
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
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    medioPago === med.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
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
                <label className="block text-xs font-medium text-zinc-400 mb-1">Paga con ($):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-sm font-mono">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-lg text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Botones de Atajo (Billetes comunes) */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleExacto}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-xs font-mono font-bold rounded-md transition-colors"
                >
                  Exacto
                </button>
                {[1000, 2000, 5000, 10000, 20000].map(monto => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => handleQuickAmount(monto)}
                    className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono rounded-md transition-colors"
                  >
                    +${monto.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>

              {/* Display de Vuelto / Alerta */}
              <div className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                pagoInsuficiente 
                  ? 'bg-red-950/30 border-red-800/50 text-red-400' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-200'
              }`}>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {pagoInsuficiente ? '⚠️ Falta abonar' : '💵 Vuelto a Entregar'}
                </span>
                <span className={`text-xl font-mono font-bold ${
                  pagoInsuficiente ? 'text-red-400' : 'text-emerald-400'
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
              className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || pagoInsuficiente}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {enviando ? '⏳ Finalizando...' : '⚡ Finalizar y Registrar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}