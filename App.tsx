import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Schedule from "./pages/Schedule.tsx";
import Reservations from "./pages/Reservations.tsx";
import Partners from "./pages/Partners.tsx";
import Finances from "./pages/Finances.tsx";
import Reports from "./pages/Reports.tsx";

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center gap-1.5 leading-none ${className}`}>
    <span className="font-black italic uppercase tracking-tighter text-red-500">Surf'in</span>
    <span className="font-black italic uppercase tracking-tighter text-red-500">Ericeira</span>
  </div>
);

const Navigation: React.FC<{ activeTab: string, setActiveTab: (t: string) => void }> = ({ activeTab, setActiveTab }) => {
  const { user, language } = useApp();
  const t = translations[language];

  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: 'schedule', label: t.schedule, icon: '📅' },
    { id: 'reservations', label: t.reservations, icon: '🏄‍♂️' },
  ];

  if (user?.role === UserRole.ADMIN) {
    tabs.push(
      { id: 'partners', label: t.partners, icon: '🤝' },
      { id: 'finances', label: t.finances, icon: '💰' },
      { id: 'reports', label: t.reports, icon: '📄' }
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center h-16 safe-bottom z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all ${
            activeTab === tab.id ? 'text-blue-600 scale-105' : 'text-slate-400'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

const Header: React.FC = () => {
  const { user, language, setLanguage, logout } = useApp();
  const t = translations[language];

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <Logo className="text-[18px]" />
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest truncate max-w-[80px]">{user?.name}</p>
      </div>
      <div className="flex items-center gap-3">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-slate-100 text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
        >
          <option value="pt">PT</option>
          <option value="en">EN</option>
        </select>
        <button onClick={logout} className="text-lg hover:bg-slate-100 transition-colors bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">🚪</button>
      </div>
    </header>
  );
};

const MainContent: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return <Login />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'schedule': return <Schedule />;
      case 'reservations': return <Reservations />;
      case 'partners': return <Partners />;
      case 'finances': return <Finances />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-slate-50">
      <Header />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
