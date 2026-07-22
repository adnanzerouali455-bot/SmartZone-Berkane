import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

import { QUARTIERS, Quartier, PointScore } from './data/quartiers';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { Map } from './components/Map';
import { QuartierDetail } from './components/QuartierDetail';
import { PointDetail } from './components/PointDetail';
import { QuartierTable } from './components/QuartierTable';
import { TableProperties } from 'lucide-react';

const queryClient = new QueryClient();

function Home() {
  const quartiers = QUARTIERS;
  const [selectedQuartier, setSelectedQuartier] = useState<Quartier | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number; zoom: number } | undefined>();
  const [showTable, setShowTable] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<PointScore | null>(null);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Colonne gauche */}
        <aside className="w-[380px] flex-shrink-0 flex flex-col border-r bg-white overflow-hidden z-40 relative shadow-sm">
          <ChatPanel 
            quartiers={quartiers} 
            onRecommendation={(qs) => {
              setHighlightedIds(qs.map(q => q.id));
              if (qs.length === 1) {
                setCenterOn({ lat: qs[0].lat, lng: qs[0].lng, zoom: 16 });
                setSelectedQuartier(qs[0]);
              } else if (qs.length > 1) {
                setCenterOn({ lat: 34.9218, lng: -2.3200, zoom: 14 });
                setSelectedQuartier(null);
              }
            }} 
          />
          
          <div className="border-t p-4 overflow-y-auto flex-1 bg-gray-50/50">
            <h3 className="font-semibold text-sm mb-3 text-gray-800">🏆 Classement Global</h3>
            <div className="space-y-2">
              {[...quartiers].sort((a,b) => b.scoreGlobal - a.scoreGlobal).map((q, i) => (
                <div 
                  key={q.id} 
                  onClick={() => { 
                    setSelectedQuartier(q); 
                    setCenterOn({ lat: q.lat, lng: q.lng, zoom: 16 });
                    setHighlightedIds([q.id]);
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                    selectedQuartier?.id === q.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <span className="text-lg w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm font-bold text-gray-400">{i+1}.</span>}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{q.nom}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-blue-600">{q.scoreGlobal}</span>
                    <span className="text-[10px] text-gray-400">/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Zone droite */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-100 z-10">
          <div className="absolute top-4 right-4 z-[1000]">
            <button 
              onClick={() => setShowTable(!showTable)}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg shadow border flex items-center gap-2 transition-colors"
            >
              <TableProperties size={18} className="text-blue-600" />
              Comparateur détaillé
            </button>
          </div>

          <Map 
            quartiers={quartiers} 
            highlightedIds={highlightedIds}
            onQuartierClick={(q) => {
              setSelectedQuartier(q);
              setClickedPoint(null);
              setHighlightedIds([q.id]);
              setCenterOn({ lat: q.lat, lng: q.lng, zoom: 16 });
            }}
            onMapClick={(point) => {
              setClickedPoint(point);
              setSelectedQuartier(null);
              setHighlightedIds([]);
            }}
            centerOn={centerOn} 
          />

          {/* Panel détail rétractable en bas */}
          <div className={`absolute bottom-0 left-0 right-0 bg-white border-t shadow-2xl transition-transform duration-300 z-[500] ${(selectedQuartier || clickedPoint) ? 'translate-y-0' : 'translate-y-full'}`}>
            {selectedQuartier && (
              <QuartierDetail 
                quartier={selectedQuartier} 
                onClose={() => {
                  setSelectedQuartier(null);
                  setHighlightedIds([]);
                  setCenterOn({ lat: 34.9218, lng: -2.3200, zoom: 14 });
                }} 
              />
            )}
            {clickedPoint && !selectedQuartier && (
              <PointDetail
                point={clickedPoint}
                onClose={() => setClickedPoint(null)}
              />
            )}
          </div>

          {/* Tableau modal */}
          {showTable && (
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-[600] overflow-hidden flex flex-col">
              <div className="m-4 md:m-8 bg-white rounded-xl shadow-2xl flex-1 flex flex-col overflow-hidden border">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                    <TableProperties className="text-blue-600" /> Comparateur des quartiers
                  </h2>
                  <button 
                    onClick={() => setShowTable(false)} 
                    className="text-gray-500 hover:bg-gray-200 p-1.5 rounded-md transition-colors"
                  >
                    ✕ Fermer
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-50/30">
                  <QuartierTable 
                    quartiers={quartiers} 
                    highlightedIds={highlightedIds} 
                    onSelect={(q) => { 
                      setSelectedQuartier(q); 
                      setHighlightedIds([q.id]);
                      setCenterOn({ lat: q.lat, lng: q.lng, zoom: 16 });
                      setShowTable(false); 
                    }} 
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
