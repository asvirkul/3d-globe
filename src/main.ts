import { GlobeEngine } from './engine/GlobeEngine';
import { GlobeWorld } from './engine/world/GlobeWorld';
import { createEarth } from './engine/objects/Earth';
import { EarthController } from './engine/controllers/EarthController';
import { CameraController } from './engine/controllers/CameraController';
import { OrbitController } from './engine/controllers/OrbitController';
import { createCloudLayers } from './engine/objects/Clouds';
import { CloudController } from './engine/controllers/ZoomCloudController';
import { createStars } from './engine/objects/Stars';
import { StarsController } from './engine/controllers/StarsController';
import { computeStarsRadius } from './engine/utils/stars';
import { createLights } from './engine/objects/Lights';
import { LightController } from './engine/controllers/LightController';
import { loadGlobeAssets } from './engine/utils/loadGlobeAssets';


async function init() {
  const container = document.getElementById('globe');
  if (!container) throw new Error('Globe container not found');
  
  const EARTH_RADIUS = 200;
  
  const engine = new GlobeEngine(container);
  const renderer = engine.getRenderer();
  const assets = await loadGlobeAssets();


  const earth = createEarth({
    radius:  EARTH_RADIUS , 
    texture: assets.earth,
  });
  
  
  const world = new GlobeWorld(earth);
  engine.add(world.root);
  
  const earthController = new EarthController(world.earthGroup, {
    autoRotate: true,
    rotateSpeed: 0.002,
  });
  engine.addController(earthController);
  
  const cameraController = new CameraController(engine.getCamera(), {
    radius: EARTH_RADIUS,
    distance: EARTH_RADIUS * 3,
    damping: 0.08,
    minDistance: EARTH_RADIUS * 1.5,  
    maxDistance: EARTH_RADIUS * 3
  });
  engine.addController(cameraController);
  
  const orbit = new OrbitController(cameraController, container)
  
  const clouds = createCloudLayers(renderer, {
    radius: EARTH_RADIUS,
    texture: assets.clouds
  });
  
  world.addToEarth(clouds);
  
  
  const cloudController = new CloudController(
    cameraController,
    clouds
  );
  
  engine.addController(cloudController);
  
  const camera = engine.getCamera();
  
  const stars = createStars({
    radius: computeStarsRadius(camera),
    fov: camera.fov,
    screenHeight: container.clientHeight
  });
  
  engine.add(stars);
  
  const starsController = new StarsController(
    stars,
    engine.getCamera(),
    cameraController
  );
  
  engine.addController(starsController);
  
  
  const lights = createLights(renderer, {
    radius: EARTH_RADIUS + 0.5,
    texture: assets.lights,
  });
  
  world.addToEarth(lights.mesh);
  
  const lightController = new LightController(lights.material);
  engine.addController(lightController);
  
  
  orbit.onStartDrag = () => earthController.pauseAutoRotate();
  orbit.onEndDrag   = () => earthController.resumeAutoRotate();
  
  engine.addController(orbit);
  
  cameraController.lookAtLatLon(0, 0);
  engine.warmup();
  engine.start();
}

init();
