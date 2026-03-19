import { useContext } from 'react';
import { DemoModeContext } from '../App';

export const useDemoMode = () => {
  return useContext(DemoModeContext);
};
