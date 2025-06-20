'use client';

import Link from 'next/link';
import { Cpu, Zap, ArrowRight, Github } from 'lucide-react';

export default function R2DJHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent text-center">
            R2DJ 2.0
          </h1>
          <p className="text-xl text-gray-300 text-center mt-4">
            Emotion-to-Sound Music Companion
          </p>
        </div>
      </header>

      {/* Mode Selection */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          
          {/* Classic Mode */}
          <Link href="/classic">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 group cursor-pointer border border-white/20 hover:border-blue-400/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-blue-500/20">
                  <Cpu size={32} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-400">Classic Mode</h2>
                  <p className="text-gray-300">Rule-Based • No AI • Start Here</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Predefined mood scenes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Voice volume & cadence analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Keyword-based triggers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Low latency, reliable</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-300 mb-2">4 Predefined Moods:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <div>• Calm (60 BPM)</div>
                  <div>• Playful (100 BPM)</div>
                  <div>• Trippy (75 BPM)</div>
                  <div>• Intense (130 BPM)</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-green-400 font-medium">✓ Recommended</span>
                <ArrowRight size={20} className="text-blue-400 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>

          {/* AI Mode */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 opacity-60">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-purple-500/20">
                <Zap size={32} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-purple-400">AI Mode</h2>
                <p className="text-gray-300">Advanced • Coming Soon</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400">Advanced emotion detection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400">GPT-powered sentiment analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400">Magenta.js music generation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400">Adaptive learning</span>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-300 mb-2">Future Features:</h3>
              <div className="text-sm text-gray-400">
                <div>• Continuous emotion mapping</div>
                <div>• AI-generated music variations</div>
                <div>• Personalized mood detection</div>
                <div>• Multi-modal input support</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-yellow-400 font-medium">⚠ Under Development</span>
              <div className="text-gray-500">Coming Soon</div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/5 rounded-xl p-6">
              <div className="text-2xl font-bold text-blue-400 mb-2">1</div>
              <h3 className="font-semibold mb-2">Choose Classic Mode</h3>
              <p className="text-gray-400 text-sm">Start with rule-based logic for immediate, reliable results.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <div className="text-2xl font-bold text-green-400 mb-2">2</div>
              <h3 className="font-semibold mb-2">Initialize Audio</h3>
              <p className="text-gray-400 text-sm">Click &quot;Initialize Audio Engine&quot; and grant microphone permissions.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6">
              <div className="text-2xl font-bold text-purple-400 mb-2">3</div>
              <h3 className="font-semibold mb-2">Start Your Journey</h3>
              <p className="text-gray-400 text-sm">Press play and let your voice or keywords control the music!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <span>Built with Next.js + Tone.js</span>
            <a 
              href="https://github.com/allinfinite/R2DJ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Github size={16} />
              <span>Open Source</span>
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            &quot;Where emotion meets sound, consciousness expands.&quot;
          </p>
        </footer>
      </div>
    </div>
  );
}
