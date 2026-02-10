import React, { createContext, ReactNode, useContext, useState } from 'react';

// Definiujemy kształt danych (dla TypeScript)
interface GameContextType {
  settings: any;
  setSettings: (settings: any) => void;
  players: any[];
  setPlayers: (players: any[]) => void;
  initGame: (newPlayers: any[], newSettings: any) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState({
    targetScore: 501,
    setsToWin: 1,
    legsToWin: 1,
    isDoubleOut: true,
  });

  const [players, setPlayers] = useState<any[]>([]);

  const initGame = (newPlayers: any[], newSettings: any) => {
    const initializedPlayers = newPlayers.map(p => ({
      ...p,
      score: newSettings.targetScore,
      legsWon: 0,
      setsWon: 0,
      throwsHistory: [],
      currentTurnThrows: [],
      scoreAtStartOfTurn: newSettings.targetScore
    }));
    
    setPlayers(initializedPlayers);
    setSettings(newSettings);
  };

  return (
    <GameContext.Provider value={{ settings, setSettings, players, setPlayers, initGame }}>
      {children}
    </GameContext.Provider>
  );
};