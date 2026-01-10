import React from 'react';
import { Clock } from 'lucide-react';
import logoSportFitness from '@/assets/logo-sport-fitness.png';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <img src={logoSportFitness} alt="Sport Fitness" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-display tracking-wider text-gradient">
              SPORT FITNESS LIVE
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Mídia e Avisos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="font-mono text-2xl font-semibold text-foreground">
            {currentTime.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
