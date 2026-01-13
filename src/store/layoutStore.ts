import type { CMSUser } from '@/app/actions/cms/getUser';
import { create } from 'zustand';

interface LayoutState {
  user: CMSUser | null;
  sidePanelSections: string[];
  activeSection: string | null;
  heroSection: {
    mainImage: string | null;
    blurhashURL: string | null;
    resume_en: string | null;
    resume_it: string | null;
  } | null;
  loading: boolean;
  error: string | null;
  setUser: (user: CMSUser | null) => void;
  setSidePanelSections: (sections: string[]) => void;
  setActiveSection: (section: string) => void;
  setHeroSection: (heroSection: {
    mainImage: string | null;
    blurhashURL: string | null;
    resume_en: string | null;
    resume_it: string | null;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  user: null,
  sidePanelSections: [],
  activeSection: 'hero',
  heroSection: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setSidePanelSections: (sections) => set({ sidePanelSections: sections }),
  setActiveSection: (section) => set({ activeSection: section }),
  setHeroSection: (heroSection) => set({ heroSection }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
