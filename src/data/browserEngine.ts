import { createEngine } from '../sim/engine';

/** One simulator for the tab, used when the Node server is absent. */
export const browserEngine = createEngine();
