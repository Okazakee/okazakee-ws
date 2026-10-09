import { soundDefinitions } from './definitions';
import { createSfxEngine } from './engine';

export type { SfxName } from './model';

export interface SfxApi {
  readonly tap: () => void;
  readonly hover: () => void;
  readonly glitch: () => void;
  readonly matrix: () => void;
}

const engine = createSfxEngine(soundDefinitions);

export const sfx: SfxApi = {
  tap: (): void => {
    engine.play('tap');
  },
  hover: (): void => {
    engine.play('hover');
  },
  glitch: (): void => {
    engine.play('glitch');
  },
  matrix: (): void => {
    engine.play('matrix');
  },
};
