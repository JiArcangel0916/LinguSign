import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const LearnLayout = ({ children, onLogout }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [username, setUsername] = useState('User');
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata?.username;
      if (meta) setUsername(meta);

      const { data } = await supabase
        .from('User')
        .select('total_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setXp(data.total_xp ?? 0);
    };
    fetchUser();
  }, []);

  const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <div className="min-h-screen bg-white font-fredoka">
      <div className="bg-primary h-[80px] w-full flex items-center justify-between px-10">
        <img src="/palmingo-logo-white.svg" alt="Palmingo Logo" className="h-12" />
        <div className="relative">
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-base font-bold text-white leading-tight">{username}</span>
              <span className="text-xs text-white opacity-70 leading-tight">XP: {xp}</span>
            </div>
            <svg
              className={`w-4 h-4 text-white transition-transform ${showLogout ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showLogout && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
};

export default LearnLayout;