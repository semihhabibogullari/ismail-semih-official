/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Bot,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { AiProposal } from '../../types';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProposalApplied?: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onProposalApplied,
}) => {
  const { sendAiCommand, applyAiProposal } = useSite();
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AiProposal | null>(null);
  const [history, setHistory] = useState<
    Array<{ type: 'user' | 'assistant'; text: string; proposal?: AiProposal }>
  >([
    {
      type: 'assistant',
      text: 'Merhaba! Ben İsmail Semih Studio yapay zekâ asistanınızım. Tasarımınızı, fontlarınızı, slider geçişlerinizi veya site ayarlarınızı doğal Türkçe komutlarla düzenleyebilirsiniz.',
    },
  ]);

  const quickPrompts = [
    'Başlık fontunu Playfair Display yap',
    'Slider geçişini Ken Burns yap',
    'Vurgu rengini altın sarısı (#e5a93b) yap',
    'Instagram akışında beğeni sayılarını göster',
    'Hero slider otomatik geçiş süresini 4 saniye yap',
  ];

  const handleSendCommand = async (cmdText: string) => {
    const textToSend = cmdText.trim();
    if (!textToSend || isLoading) return;

    setCommand('');
    setHistory((prev) => [...prev, { type: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      const res = await sendAiCommand(textToSend);
      if (res.success && res.proposal) {
        setActiveProposal(res.proposal);
        setHistory((prev) => [
          ...prev,
          {
            type: 'assistant',
            text: res.message || 'Komutunuz analiz edildi ve aşağıdaki değişiklik önerisi hazırlandı. Onaylarsanız taslağa uygulanacaktır.',
            proposal: res.proposal,
          },
        ]);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            type: 'assistant',
            text: res.error || 'Bu komut anlaşılamadı. Lütfen font, renk, slider veya metin değişikliğiyle ilgili bir talep belirtin.',
          },
        ]);
      }
    } catch (e: any) {
      setHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: 'Bağlantı hatası: ' + e.message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (proposal: AiProposal) => {
    setIsLoading(true);
    try {
      const res = await applyAiProposal(proposal);
      if (res.success) {
        setActiveProposal(null);
        setHistory((prev) => [
          ...prev,
          {
            type: 'assistant',
            text: `✅ Değişiklik başarıyla taslağa uygulandı! Sayfayı kontrol edebilir ve hazır olduğunuzda canlıya yayınlayabilirsiniz.`,
          },
        ]);
        if (onProposalApplied) onProposalApplied();
      } else {
        alert(res.message || 'Öneri uygulanamadı.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setActiveProposal(null);
    setHistory((prev) => [
      ...prev,
      {
        type: 'assistant',
        text: '❌ Değişiklik önerisi reddedildi. Mevcut taslak korundu.',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-[#121218] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#151520]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5a1f] to-amber-500 flex items-center justify-center text-white shadow-md shadow-[#ff5a1f]/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>AI ASİSTANIM</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#ff8c42] font-mono">
                  v2.0
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Doğal dil ile tasarım ve içerik yönetimi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat / Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.type === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-[#ff5a1f] text-white rounded-tr-xs'
                    : 'bg-[#181824] border border-white/10 text-gray-200 rounded-tl-xs shadow-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* If message has an actionable proposal */}
              {msg.proposal && activeProposal && activeProposal.id === msg.proposal.id && (
                <div className="mt-3 w-full bg-[#151520] border-2 border-[#ff5a1f]/60 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#ff5a1f] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      YAPAY ZEKÂ DEĞİŞİKLİK ÖNERİSİ
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff5a1f]/15 text-[#ff8c42] font-mono font-semibold">
                      {activeProposal.targetComponent}.{activeProposal.field}
                    </span>
                  </div>

                  {/* Comparison Diff Box */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0b0b0f] border border-white/5 text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase font-bold">
                        Eski Değer
                      </span>
                      <span className="text-gray-400 font-mono line-clamp-2">
                        {typeof activeProposal.oldValue === 'object'
                          ? JSON.stringify(activeProposal.oldValue)
                          : String(activeProposal.oldValue || '—')}
                      </span>
                    </div>
                    <div className="border-l border-white/10 pl-2">
                      <span className="text-emerald-400 block text-[9px] uppercase font-bold">
                        Yeni Değer
                      </span>
                      <span className="text-emerald-300 font-mono font-bold line-clamp-2">
                        {typeof activeProposal.newValue === 'object'
                          ? JSON.stringify(activeProposal.newValue)
                          : String(activeProposal.newValue)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-normal italic">
                    "{activeProposal.reason}"
                  </p>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span>Reddet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApply(activeProposal)}
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-lg bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-md shadow-[#ff5a1f]/20"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Taslağa Uygula</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 text-xs italic p-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#ff5a1f]" />
              <span>Yapay zekâ isteğinizi analiz ediyor ve öneri hazırlıyor...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="p-3 bg-[#151520]/80 border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2 font-medium">
            <Lightbulb className="w-3 h-3 text-[#ff5a1f]" />
            <span>Hızlı Komut Önerileri:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendCommand(p)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#ff5a1f]/20 hover:text-[#ff8c42] border border-white/10 text-[10px] text-gray-300 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Command Input Bar */}
        <div className="p-4 border-t border-white/10 bg-[#151520]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand(command);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Örn: Başlık fontunu Cinzel yap..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0b0b0f] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]"
            />
            <button
              type="submit"
              disabled={isLoading || !command.trim()}
              className="p-2.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-[#ff5a1f]/20"
              aria-label="Komut Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
