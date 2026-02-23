import { CONFIG } from './config.js';

/**
 * Entry point – creates the PixiJS application and attaches it to the DOM.
 * Scene logic will be added in later steps.
 */
async function init() {
  const { Application } = await import('pixi.js');

  const app = new Application();
  await app.init({
    width: CONFIG.stageWidth,
    height: CONFIG.stageHeight,
    background: '#1a1a2e',
  });

  document.body.appendChild(app.canvas);

  if (CONFIG.debugMode) {
    console.log('Fishing Cat – debug mode ON');
    console.log('CONFIG:', CONFIG);
  }
}

init();
