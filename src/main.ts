import { createGlobe } from './globe/createGlobe';

async function init() {
  const container = document.getElementById('globe');
  if (!container) return;

  const globe = await createGlobe(container);
  globe.start();
}

init();