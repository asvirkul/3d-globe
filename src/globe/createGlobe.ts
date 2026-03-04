import type { GlobeData } from './loadGlobeData';
import type { GlobeAPI, CreateGlobeOptions } from "./types";
import { GlobeEngine } from '../engine/GlobeEngine';
import { GlobeWorld } from '../engine/world/GlobeWorld';
import { createEarth } from '../engine/objects/Earth';
import { EarthController } from '../engine/controllers/EarthController';
import { CameraController } from '../engine/controllers/CameraController';
import { OrbitController } from '../engine/controllers/OrbitController';
import { createCloudLayers } from '../engine/objects/Clouds';
import { CloudController } from '../engine/controllers/ZoomCloudController';
import { createStars } from '../engine/objects/Stars';
import { StarsController } from '../engine/controllers/StarsController';
import { computeStarsRadius } from '../engine/utils/stars';
import { createLights } from '../engine/objects/Lights';
import { LightController } from '../engine/controllers/LightController';
import { createCountryBordersLayer } from "./borders/countryBorderLayer";
import { CountryPickController } from './interactions/countryPickController';
import { CountryFocusController } from './interactions/countryFocusController';
import { InteractionCoordinator } from './interactions/interactionCoordinator';

export function createGlobe(
  container: HTMLElement, 
  data: GlobeData,
  options: CreateGlobeOptions = {}
): GlobeAPI {
  const EARTH_RADIUS = 200;
  const minCountryZoom = 0.4;
  const engine = new GlobeEngine(container);
  const renderer = engine.getRenderer();
  const camera = engine.getCamera();
  const { assets, countries } = data;


  const earth = createEarth({
    radius: EARTH_RADIUS,
    texture: assets.earth,
  });

  const world = new GlobeWorld(earth.group);
  engine.add(world.root);

  const cameraController = new CameraController(camera, {
    radius: EARTH_RADIUS,
    distance: EARTH_RADIUS * 3,
    damping: 0.09,
    minDistance: EARTH_RADIUS * 1.3,
    maxDistance: EARTH_RADIUS * 3,
  });
  engine.addController(cameraController);

  const earthController = new EarthController(cameraController, {
    autoRotate: true,
    rotateSpeed: 0.05,
  });
  engine.addController(earthController);

  const orbit = new OrbitController(
    cameraController,
    renderer.domElement,
    world.earthGroup,
    camera
  );

  orbit.onStartDrag = () => earthController.pauseAutoRotate();
  orbit.onEndDrag   = () => earthController.resumeAutoRotate();

  engine.addController(orbit);

  const clouds = createCloudLayers(renderer, {
    radius: EARTH_RADIUS,
    texture: assets.clouds,
  });

  world.addToEarth(clouds);

  const cloudController = new CloudController(
    cameraController,
    clouds
  );
  engine.addController(cloudController);

  const stars = createStars({
    radius: computeStarsRadius(camera),
    fov: camera.fov,
    screenHeight: container.clientHeight,
  });

  engine.add(stars);

  const starsController = new StarsController(
    stars,
    camera,
    cameraController
  );
  engine.addController(starsController);

  const lights = createLights(renderer, {
    radius: EARTH_RADIUS + 0.5,
    texture: assets.lights,
  });

  world.addToEarth(lights.mesh);

  const bordersLayer = createCountryBordersLayer(
    world.earthGroup,
    countries,
    EARTH_RADIUS
  );

  const lightController = new LightController(lights.material);
  engine.addController(lightController);

  cameraController.lookAtLatLon(0, 0);

  const interactionCoordinator = new InteractionCoordinator(bordersLayer.highlight);
  const canCountryInteract = () => cameraController.getZoomNormalized() <= minCountryZoom;

  const pickController = new CountryPickController(
    renderer.domElement,
    earth.mesh,
    camera,
    countries,
    {
      onPick: (iso) => {
        interactionCoordinator.setSelected(iso);
        options.onCountryPick?.(iso);
      },
      canInteract: canCountryInteract,
    }
  );

  const focusController = new CountryFocusController(
    earth.mesh,
    camera,
    countries,
    {
      canInteract: canCountryInteract,
      onFocus: (iso) => {
        interactionCoordinator.setFocused(iso);
      }
    }
  );

  engine.addController(pickController);
  engine.addController(focusController);

  engine.warmup();

  const api: GlobeAPI = {
    start: engine.start.bind(engine),
    stop: engine.stop.bind(engine),
    destroy: engine.destroy.bind(engine),
    setAutoRotate: (enabled) =>
        enabled
        ? earthController.resumeAutoRotate()
        : earthController.pauseAutoRotate(),
    flyToLatLon: cameraController.flyToLatLon.bind(cameraController),
    highlightCountry: bordersLayer.highlight
  };
  return api;
}