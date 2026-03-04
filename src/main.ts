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

  const globe = createGlobe(container, globeData.value, {
   onCountryPick: (iso) => {
      if (!iso) return;
      console.log('Selected ISO:', iso)
    },
  } );

  globe.start();
}

init();