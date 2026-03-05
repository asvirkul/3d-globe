import { createGlobe } from './globe/createGlobe';
import { loadGlobeData } from './globe/loadGlobeData';
async function init() {
  const container = document.getElementById('globe');
  if (!container) return;

  const globeData = await loadGlobeData();

  if (!globeData.ok) {
    console.error(globeData.error);
    return;
  }

  const globe = createGlobe(container, globeData.value );

  globe.start();
}

init();