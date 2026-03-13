import { Calendar, Search, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  searchTerm, 
  setSearchTerm 
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void,
  searchTerm: string,
  setSearchTerm: (s: string) => void
}) {
  const [initials, setInitials] = useState('U');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        const nameParts = user.user_metadata.full_name.split(' ');
        if (nameParts.length > 1) {
          setInitials(`${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase());
        } else {
          setInitials(nameParts[0].substring(0, 2).toUpperCase());
        }
      } else if (user?.email) {
        setInitials(user.email.substring(0, 2).toUpperCase());
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const navItems = [
    { id: 'dashboard', label: 'Painel' },
    { id: 'clientes', label: 'Clientes' },
  ];

  return (
    <header className="bg-white border-b border-violet-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center space-x-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a0a2e] via-[#4c1d95] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-violet-200">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Agenda Nura</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'text-white bg-brand-primary shadow-md shadow-violet-100'
                    : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Side: Search, Profile, Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-6">
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar agendamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all placeholder-slate-400 text-slate-700"
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center overflow-hidden border-2 border-white shadow-sm cursor-pointer" title="Perfil">
              <span className="text-sm font-bold text-white">{initials}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Hamburger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[70] md:hidden shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-slate-900 tracking-tight">Menu</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-2 flex-1 overflow-y-auto">
              {/* Search in Mobile Menu */}
              <div className="relative mb-6 lg:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all placeholder-slate-400 text-slate-700"
                />
              </div>

              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-4 rounded-2xl text-sm font-bold transition-all flex items-center space-x-3 ${
                    activeTab === item.id
                      ? 'text-white bg-brand-primary shadow-lg shadow-violet-100'
                      : 'text-slate-600 hover:bg-violet-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-4 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all flex items-center space-x-3"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
