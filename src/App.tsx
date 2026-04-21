import { useState, useEffect, useRef, useMemo, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  X, 
  Trophy, 
  Coins, 
  Monitor, 
  Cpu, 
  Zap,
  ChevronRight,
  Heart,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';

// --- Types ---
interface Game {
  id: string;
  title: string;
  filename: string;
  color: 'neon' | 'pink' | 'cyan' | 'gold';
  icon: typeof Gamepad2;
}

// --- Data ---
const GAMES: Game[] = [
  { id: '1', title: 'NEON DRIFT', filename: 'neon-drift.html', color: 'cyan', icon: Gamepad2 },
  { id: '2', title: 'CYBER DEFENDER', filename: 'cyber-defender.html', color: 'pink', icon: Cpu },
  { id: '3', title: 'GRID LOCK', filename: 'grid-lock.html', color: 'neon', icon: Monitor },
  { id: '4', title: 'DINO RUN', filename: 'dino-run.html', color: 'gold', icon: Trophy },
  { id: '5', title: 'UNIT DEFENDER', filename: 'unit-defender.html', color: 'cyan', icon: Zap },
  { id: '6', title: 'NEON LEAP', filename: 'neon-leap.html', color: 'pink', icon: Gamepad2 },
  { id: '7', title: 'RETRO 2048', filename: 'retro-2048.html', color: 'neon', icon: Cpu },
  { id: '8', title: 'BIT EATER', filename: 'bit-eater.html', color: 'gold', icon: Monitor },
  { id: '9', title: 'COLOR MATCH', filename: 'color-match.html', color: 'cyan', icon: Trophy },
  { id: '10', title: 'BIT BOUNCE', filename: 'bit-bounce.html', color: 'pink', icon: Zap },
  { id: '11', title: 'RETRO PATH', filename: 'retro-path.html', color: 'neon', icon: Gamepad2 },
  { id: '12', title: 'CYBER BOUNCE', filename: 'cyber-bounce.html', color: 'gold', icon: Cpu },
  { id: '13', title: 'STACK TOWER', filename: 'stack-tower.html', color: 'cyan', icon: Monitor },
  { id: '14', title: 'CYBER JUMPER', filename: 'cyber-jumper.html', color: 'pink', icon: Trophy },
  { id: '15', title: 'GALAXY OVERLORD', filename: 'galaxy-overlord.html', color: 'neon', icon: Zap },
  { id: '16', title: 'TIC TAC TOE', filename: 'tic-tac-toe.html', color: 'gold', icon: Gamepad2 },
  { id: '17', title: 'RETRO SNAKE', filename: 'snake.html', color: 'cyan', icon: Gamepad2 },
];

// --- Audio Utility ---
let audioCtx: AudioContext | null = null;
const playRetroSound = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  if (typeof window === 'undefined') return;
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const playCategorySound = (color: Game['color']) => {
  switch (color) {
    case 'neon': playRetroSound(440, 'square', 0.1); break;
    case 'pink': playRetroSound(150, 'sawtooth', 0.2); break;
    case 'cyan': playRetroSound(880, 'sine', 0.05); break;
    case 'gold': playRetroSound(600, 'triangle', 0.15); break;
  }
};

export default function App() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [systemOnline, setSystemOnline] = useState(false);
  
  // Settings & UI State
  const [showSettings, setShowSettings] = useState(false);
  const [useCrt, setUseCrt] = useState(() => localStorage.getItem('arcade-crt') !== 'false');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('arcade-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Attract Mode Logic
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isAttractMode, setIsAttractMode] = useState(false);
  const ATTRACT_TIMEOUT = 30000; // 30 seconds

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (isAttractMode) {
        setIsAttractMode(false);
        playRetroSound(400, 'sine', 0.2, 0.05);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > ATTRACT_TIMEOUT && !activeGame && !isAttractMode) {
        setIsAttractMode(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity, activeGame, isAttractMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSystemOnline(true);
      setTimeout(() => playRetroSound(200, 'square', 0.5, 0.05), 100);
    }, 1500);

    const handleDragStart = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragstart', handleDragStart);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  const toggleFavorite = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id];
      localStorage.setItem('arcade-favorites', JSON.stringify(next));
      playRetroSound(next.includes(id) ? 600 : 300, 'sine', 0.1);
      return next;
    });
  };

  const closeGame = () => {
    playRetroSound(100, 'sawtooth', 0.2, 0.1);
    setActiveGame(null);
  };

  const selectGame = (game: Game) => {
    playCategorySound(game.color);
    setActiveGame(game);
  };

  const sortedGames = useMemo(() => {
    return [...GAMES].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [favorites]);

  if (!systemOnline) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-arcade-black text-retro-cyan font-press-start p-4 text-center crt-overlay ${!useCrt ? 'crt-off' : ''}`}>
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: [0, 1, 0, 1] }}
           transition={{ duration: 1, repeat: Infinity }}
           className="text-2xl mb-8"
        >
          LOADING...
        </motion.div>
        <div className="w-64 h-4 bg-gray-900 border-2 border-gray-700 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2 }}
            className="h-full bg-retro-cyan shadow-[0_0_15px_#00ffff]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`crt-overlay ${!useCrt ? 'crt-off' : ''}`}>
      <Starfield />

      <div className="main-container">
        {/* --- Header Area --- */}
        <header className="header-area flex items-center justify-between px-4">
          <div className="w-10" /> {/* Spacer */}
          <div className="logo-text">PIXEL ARCADE 17</div>
          <button 
            onClick={() => { setShowSettings(true); playRetroSound(500, 'sine', 0.1); }}
            className="p-2 text-retro-cyan hover:bg-retro-cyan/10 rounded transition-colors"
          >
            <Settings className="size-6" />
          </button>
        </header>

        {/* --- Game Grid --- */}
        <main className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-2 overflow-y-auto">
          {sortedGames.map((game, index) => (
            <GameCard 
              key={game.id} 
              game={game} 
              index={index} 
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={(e) => toggleFavorite(game.id, e)}
              onSelect={(g) => selectGame(g)} 
            />
          ))}
        </main>

        {/* --- Footer Bar --- */}
        <footer className="footer-bar-themed">
          <div className="flex items-center">
            <span className="status-dot-themed"></span>
            SYSTEM READY - 17 GAMES LOADED
          </div>
          <div>ARCADE OS v1.0.4 - [PLAYER 1]</div>
        </footer>

        {/* --- Attract Mode Overlay --- */}
        <AnimatePresence>
          {isAttractMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[50000] bg-black bg-opacity-90 flex flex-col items-center justify-center pointer-events-none"
            >
              <motion.div 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ duration: 1, repeat: Infinity }}
                className="font-press-start text-retro-magenta text-4xl mb-12 shadow-retro-magenta"
              >
                INSERT COIN
              </motion.div>
              <div className="font-vt323 text-retro-green text-2xl space-y-4 text-center">
                <p>--- HIGH SCORES ---</p>
                <div className="flex gap-8 justify-between w-64"><span>GDR</span> <span>999,999</span></div>
                <div className="flex gap-8 justify-between w-64"><span>JON</span> <span>850,000</span></div>
                <div className="flex gap-8 justify-between w-64"><span>REX</span> <span>720,400</span></div>
                <div className="flex gap-8 justify-between w-64"><span>CYB</span> <span>610,000</span></div>
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-16 text-retro-cyan opacity-40 text-sm"
              >
                ANY KEY TO START
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Settings Modal --- */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60000] bg-black bg-opacity-80 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-card-bg border-4 border-gray-600 p-8 w-full max-w-md pixel-border"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="font-press-start text-retro-cyan text-xl mb-8 text-center border-b-2 border-gray-800 pb-4">SETTINGS</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-vt323 text-2xl">CRT SCANLINES</span>
                    <button 
                      onClick={() => {
                        const next = !useCrt;
                        setUseCrt(next);
                        localStorage.setItem('arcade-crt', String(next));
                        playRetroSound(next ? 800 : 400, 'sine', 0.1);
                      }}
                      className={`font-press-start text-[10px] p-2 ${useCrt ? 'bg-retro-green text-black' : 'bg-gray-800 text-white'} insert-coin-btn-themed`}
                    >
                      {useCrt ? "ACTIVE" : "OFF"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-vt323 text-2xl">AUDIO SYSTEM</span>
                    <button className="bg-retro-green text-black font-press-start text-[10px] p-2 insert-coin-btn-themed">
                      ENABLED
                    </button>
                  </div>
                </div>

                <div className="mt-12 flex justify-center">
                  <button 
                    onClick={() => { setShowSettings(false); playRetroSound(300, 'sine', 0.1); }}
                    className="pixel-btn-themed bg-gray-800 text-white font-press-start border-2 border-white p-3 hover:bg-gray-700"
                    style={{ fontSize: '10px' }}
                  >
                    BACK TO HUB
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Game Overlay (iFrame) --- */}
        <AnimatePresence>
          {activeGame && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[15000] bg-black"
            >
              <button 
                onClick={closeGame}
                className="eject-btn-themed"
              >
                EJECT / CLOSE
              </button>

              <div className="w-full h-full relative">
                 <iframe 
                  src={`games/${activeGame.filename}`}
                  className="w-full h-full border-none"
                  id="arcade-iframe"
                  title={activeGame.title}
                  referrerPolicy="no-referrer"
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Subcomponents ---

function Starfield() {
  const [stars, setStars] = useState<{ x: number; y: number; s: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 200,
      s: Math.random() * 2 + 1,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="starfield">
      <div className="stars-container">
        {stars.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.s}px`,
              height: `${star.s}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (e: MouseEvent) => void;
  onSelect: (g: Game) => void;
  key?: string | number;
}

function GameCard({ game, index, isFavorite, onToggleFavorite, onSelect }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => playRetroSound(800, 'sine', 0.02, 0.02)}
      className="cartridge-card relative"
      onClick={() => onSelect(game)}
    >
      <button 
        onClick={onToggleFavorite}
        className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-colors ${isFavorite ? 'text-retro-magenta' : 'text-gray-600 hover:text-white'}`}
      >
        <Heart className="size-4" fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <div className="thumb-box">
        <game.icon className="thumb-icon size-8" />
      </div>
      <div className="game-title-themed">
        {game.title}
      </div>
      <button className="insert-coin-btn-themed">
        INSERT COIN
      </button>
    </motion.div>
  );
}