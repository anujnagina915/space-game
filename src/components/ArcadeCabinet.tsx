import React, { useState } from 'react';
import { GameInfo } from '../types/game';
import { sounds } from '../audio/soundEffects';
import { getStandaloneCode } from '../data/standaloneTemplates';
import {
  Volume2,
  VolumeX,
  Tv,
  Maximize2,
  Code,
  Info,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Gamepad2
} from 'lucide-react';

interface ArcadeCabinetProps {
  game: GameInfo;
  highScore: number;
  onOpenSelector: () => void;
  children: React.ReactNode;
}

export const ArcadeCabinet: React.FC<ArcadeCabinetProps> = ({
  game,
  highScore,
  onOpenSelector,
  children
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [enableCRT, setEnableCRT] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    sounds.setMuted(next);
    setIsMuted(next);
  };

  const standaloneCode = getStandaloneCode(game.id);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(standaloneCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtmlFile = () => {
    const blob = new Blob([standaloneCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${game.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Console Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-3 bg-neutral-900/90 border border-neutral-800 rounded-t-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSelector}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-arcade font-bold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>ALL GAMES</span>
          </button>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-arcade font-bold text-sm text-neutral-100">{game.title}</span>
              <span className="text-[10px] text-neutral-500 font-pixel">({game.year})</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {game.renderMode}
            </span>
          </div>
        </div>

        {/* Right side utility icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* CRT scanline switch */}
          <button
            onClick={() => setEnableCRT(!enableCRT)}
            title="Toggle CRT Scanline Effect"
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              enableCRT
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              !isMuted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Info Modal trigger */}
          <button
            onClick={() => setShowInfoModal(true)}
            title="Game Instructions & Controls"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Single-File Code Exporter */}
          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-arcade font-medium transition-colors cursor-pointer ml-1"
          >
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">SINGLE-FILE HTML</span>
            <span className="sm:hidden">EXPORT</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div
        className={`w-full max-w-4xl p-2 sm:p-6 bg-neutral-950 border-x border-b border-neutral-800 rounded-b-xl shadow-2xl flex flex-col items-center crt-screen ${
          enableCRT ? 'crt-scanlines' : ''
        }`}
      >
        {children}
      </div>

      {/* Instructions & Controls Drawer / Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-pixel text-amber-400">{game.title}</span>
              <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 border border-neutral-700">
                {game.year}
              </span>
            </div>

            <p className="text-sm text-neutral-300 font-sans-clean leading-relaxed mb-6">
              {game.description}
            </p>

            <h4 className="text-xs font-pixel text-cyan-400 mb-3 tracking-wider">
              CONTROLS & KEYMAP
            </h4>
            <div className="space-y-2 mb-6">
              {game.controls.map((ctrl, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs"
                >
                  <span className="font-mono bg-neutral-800 text-neutral-200 px-2 py-1 rounded border border-neutral-700">
                    {ctrl.key}
                  </span>
                  <span className="text-neutral-400 font-sans-clean">{ctrl.action}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
              <span>Rendering Engine:</span>
              <span className="font-mono text-emerald-400">{game.renderMode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Code Exporter Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <div>
                <h3 className="font-pixel text-sm text-cyan-400 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  SINGLE-FILE HTML EXPORT: {game.title.toUpperCase()}
                </h3>
                <p className="text-xs text-neutral-400 font-sans-clean mt-1">
                  100% self-contained standalone file with embedded HTML, CSS, and JS ({game.renderMode}). Runs offline in any browser!
                </p>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Code Body */}
            <div className="p-4 flex-1 overflow-auto bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed">
              <pre className="whitespace-pre-wrap select-all">{standaloneCode}</pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900">
              <span className="text-xs text-neutral-500 font-mono">
                {standaloneCode.length} characters · 0 dependencies
              </span>
              <div className="flex gap-3">
                <button
                  onClick={copyCodeToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-arcade font-bold border border-neutral-700 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}</span>
                </button>
                <button
                  onClick={downloadHtmlFile}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg text-xs font-arcade font-bold cursor-pointer transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD .HTML</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
