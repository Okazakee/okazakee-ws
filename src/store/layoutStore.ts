import type { User } from '@/types/fetchedData.types';
import { create } from 'zustand';

interface LayoutState {
  user: User | null;
  sidePanelSections: string[];
  activeSection: string | null;
  setUser: (user: User) => void;
  setSidePanelSections: (sections: string[]) => void;
  setActiveSection: (section: string) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  user: null,
  sidePanelSections: [],
  activeSection: null,

  setUser: (user) => set({ user }),
  setSidePanelSections: (sections) => set({ sidePanelSections: sections }),
  setActiveSection: (section) => set({ activeSection: section }),
}));
