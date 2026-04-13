import type { GlobeData } from './loadGlobeData';
import type { GlobeAPI, CreateGlobeOptions } from './types';
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
import { createCountryBordersLayer } from './borders/countryBorderLayer';
import { CountryPickController } from './interactions/countryPickController';
import { CountryFocusController } from './interactions/countryFocusController';
import { CountryFocusCoordinator } from './interactions/countryFocusCoordinator';
import { CountryLabelsController } from './labels/countryLabelsController';
import { CountryLabelsLayer } from './labels/countryLabelsLayer';
import { createCountryFocusSync } from './countryHighlightSync';
import { CountryLabelInteractions } from './labels/countryLabelsInteractions';
import { CountryPinsLayer } from './pins/countryPinsLayer';
import { CountryPinsController } from './pins/countryPinController';
import { LABELS_CONFIG } from './labels/config';

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
  const { assets, countries, pins } = data;

  const earth = createEarth({
    radius: EARTH_RADIUS,
    texture: assets.earth,
  });

  const world = new GlobeWorld(earth.group);
  engine.add(world.root);

  const cameraController = new CameraController(camera, {
    radius: EARTH_RADIUS,
    distance: EARTH_RADIUS * 3.5,
    damping: 0.09,
    minDistance: EARTH_RADIUS * 1.35,
    maxDistance: EARTH_RADIUS * 3.5,
  });
  engine.addController(cameraController);

  const earthController = new EarthController(cameraController, {
    autoRotate: true,
    rotateSpeed: 0.03,
  });
  engine.addController(earthController);

  const orbit = new OrbitController(
    cameraController,
    renderer.domElement,
    world.earthGroup,
    camera
  );

  orbit.onStartDrag = () => earthController.pauseAutoRotate();
  orbit.onEndDrag = () => earthController.resumeAutoRotate();

  engine.addController(orbit);

  const clouds = createCloudLayers(renderer, {
    radius: EARTH_RADIUS,
    texture: assets.clouds,
  });

  world.addToEarth(clouds);

  const cloudController = new CloudController(cameraController, clouds);
  engine.addController(cloudController);

  const stars = createStars({
    radius: computeStarsRadius(camera),
    fov: camera.fov,
    screenHeight: container.clientHeight,
  });

  engine.add(stars);

  const starsController = new StarsController(stars, camera, cameraController);
  engine.addController(starsController);

  const lights = createLights(renderer, {
    radius: EARTH_RADIUS + 0.4,
    texture: assets.lights,
  });

  world.addToEarth(lights.mesh);

  const bordersLayer = createCountryBordersLayer(world.earthGroup, countries, EARTH_RADIUS);

  const lightController = new LightController(lights.material);
  engine.addController(lightController);

  cameraController.lookAtLatLon(0, 0);

  const canCountryInteract = () => cameraController.getZoomNormalized() <= minCountryZoom;

  const labelsLayer = new CountryLabelsLayer(countries, camera, EARTH_RADIUS, {
    ...LABELS_CONFIG,
    getZoomNormalized: () => cameraController.getZoomNormalized(),
    canInteract: canCountryInteract,
    container,
    filters: [],
  });

  const focusSync = createCountryFocusSync({
    canInteract: canCountryInteract,
    highlightBorder: bordersLayer.highlight,
  });

  const focusCoordinator = new CountryFocusCoordinator({
    onFocusChange: (iso) => {
      labelsLayer.setFocusedIso(iso);
      focusSync.sync(iso);
    },
  });

  const labelsInteraction = new CountryLabelInteractions({
    dom: renderer.domElement,
    camera,
    canInteract: canCountryInteract,
    getFocusedIso: () => focusCoordinator.getFocusedIso(),
    getEntryByIso: (iso) => labelsLayer.getEntryByIso(iso),
  });

  const pickController = new CountryPickController(
    renderer.domElement,
    earth.mesh,
    camera,
    countries,
    {
      onPick: (iso) => {
        options.onCountryPick?.(iso);
      },
      canInteract: canCountryInteract,
      getFocusedIso: () => focusCoordinator.getFocusedIso(),
      pickLabelIso: (clientX, clientY) => labelsInteraction.pickFocusedIso(clientX, clientY),
    }
  );

  const focusController = new CountryFocusController(earth.mesh, camera, countries, {
    canInteract: canCountryInteract,
    onFocus: (iso) => {
      focusCoordinator.setFocused(iso);
    },
  });

  engine.addController(pickController);
  engine.addController(focusController);

  const pinsLayer = new CountryPinsLayer(countries, pins, camera, EARTH_RADIUS, {
    canShow: canCountryInteract,
    container,
    getLabelRect: (iso) => labelsLayer.getLabelRect(iso),
    setHiddenByPins: (isoSet) => labelsLayer.setHiddenByPins(isoSet),
  });

  engine.addController(new CountryPinsController(pinsLayer));
  world.addToEarth(labelsLayer.object3d);

  engine.addController(new CountryLabelsController(labelsLayer, labelsInteraction));
  world.addToEarth(pinsLayer.object3d);

  engine.warmup();

  const api: GlobeAPI = {
    start: engine.start.bind(engine),
    stop: engine.stop.bind(engine),
    destroy: engine.destroy.bind(engine),
    setAutoRotate: (enabled) =>
      enabled ? earthController.resumeAutoRotate() : earthController.pauseAutoRotate(),
    flyToLatLon: cameraController.flyToLatLon.bind(cameraController),
    highlightCountry: (iso) => {
      focusSync.sync(iso);
    },
  };
  return api;
}
