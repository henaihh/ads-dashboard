'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/lib/data';

interface ChangeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  onChangeLogged: () => void;
}

const CHANGE_TYPES = [
  'Presupuesto',
  'Audiencia',
  'Creativos',
  'ROAS Target',
  'Estado',
  'Pujas',
  'Ubicaciones',
  'Otro',
];

export function ChangeLogModal({ isOpen, onClose, campaigns, onChangeLogged }: ChangeLogModalProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [changeType, setChangeType] = useState('');
  const [beforeValue, setBeforeValue] = useState('');
  const [afterValue, setAfterValue] = useState('');
  const [note, setNote] = useState('');
  const [changedAt, setChangedAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form and set default date to now
      setSelectedCampaign(null);
      setChangeType('');
      setBeforeValue('');
      setAfterValue('');
      setNote('');
      const now = new Date();
      setChangedAt(now.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm format
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !changeType) return;

    setLoading(true);
    try {
      const res = await fetch('/api/campaign-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id.toString(),
          campaign_name: selectedCampaign.name,
          platform: selectedCampaign.platform,
          change_type: changeType,
          before_value: beforeValue || null,
          after_value: afterValue || null,
          note: note || null,
          changed_at: new Date(changedAt).toISOString(),
        }),
      });

      if (res.ok) {
        onChangeLogged();
        onClose();
      }
    } catch (err) {
      console.error('Failed to log change:', err);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700/30 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-200">📝 Registrar Cambio</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Campaña *
            </label>
            <select
              value={selectedCampaign?.id || ''}
              onChange={(e) => {
                const campaign = campaigns.find(c => c.id.toString() === e.target.value);
                setSelectedCampaign(campaign || null);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">Selecciona una campaña</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.platform === 'meta' ? 'Meta' : 'MeLi'})
                </option>
              ))}
            </select>
          </div>

          {/* Change Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de Cambio *
            </label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">Selecciona el tipo</option>
              {CHANGE_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Before/After Values */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Antes
              </label>
              <input
                type="text"
                value={beforeValue}
                onChange={(e) => setBeforeValue(e.target.value)}
                placeholder="Valor anterior"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Después
              </label>
              <input
                type="text"
                value={afterValue}
                onChange={(e) => setAfterValue(e.target.value)}
                placeholder="Valor nuevo"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha y Hora del Cambio
            </label>
            <input
              type="datetime-local"
              value={changedAt}
              onChange={(e) => setChangedAt(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nota (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="¿Por qué hiciste este cambio?"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCampaign || !changeType}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? '⏳' : '✓ Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}