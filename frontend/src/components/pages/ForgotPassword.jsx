import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const Toast = ({ message, type }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl font-fredoka text-white text-sm font-medium flex items-center gap-3 transition-all ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
    <span className="text-lg">{type === 'error' ? '✕' : '✓'}</span>
    {message}
  </div>
);

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      showToast(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-fredoka">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <button onClick={onBack} className="text-orange-500 mb-4 hover:underline text-sm font-medium">
          ← Back to Login
        </button>
        <h2 className="text-3xl font-bold text-center text-orange-500 mb-6">Forgot Password</h2>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="text-5xl mb-2">📬</div>
            <p className="text-green-600 font-medium">Password reset email sent!</p>
            <p className="text-gray-500 text-sm">Check your inbox and click the link to reset your password.</p>
            <button onClick={onBack} className="text-orange-500 hover:underline text-sm">
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link.</p>
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;