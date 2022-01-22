import { useContext, createContext } from 'react';

import usePersistState from '../hook/usePersistState';

const PlayPauseContext = createContext({});

export const PlayPauseProvider = ({ children }: any) => {
  const [play, setPlay] = usePersistState('animation', '');

  return (
    <PlayPauseContext.Provider value={{ play, setPlay }}>
      {children}
    </PlayPauseContext.Provider>
  );
};

export function usePlayPause() {
  const context = useContext(PlayPauseContext);
  if (!context) {
    throw new Error(
      'usePlayPause debe estar dentro del proveedor PlayPauseContext'
    );
  }
  return context;
}
