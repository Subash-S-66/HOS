"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError('Access Denied. Invalid credentials.');
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setError('System Error. Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 glass-panel border border-neon-green/50 rounded-xl shadow-[0_0_30px_rgba(0,255,100,0.2)] animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neon-green glow-text font-cyber">HOS COMMAND</h2>
          <p className="text-gray-400 text-sm mt-2">Restricted Access. Authentication Required.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neon-green mb-1">IDENTIFIER</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 focus:border-neon-green focus:ring-1 focus:ring-neon-green rounded px-4 py-2 text-white outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neon-green mb-1">SECURITY KEY</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 focus:border-neon-green focus:ring-1 focus:ring-neon-green rounded px-4 py-2 text-white outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon-green/20 hover:bg-neon-green/40 border border-neon-green text-neon-green font-bold py-3 px-4 rounded transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,100,0.5)] flex justify-center items-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'INITIATE UPLINK'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
