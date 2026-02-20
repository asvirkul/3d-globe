import * as THREE from 'three';

export class GlobeWorld {

  public readonly root: THREE.Group;

  public readonly orbitGroup: THREE.Group;

  public readonly earthGroup: THREE.Group;

  public readonly effectsGroup: THREE.Group;

  constructor(earth: THREE.Object3D) {

    this.root = new THREE.Group();
    this.root.name = 'GlobeRoot';

    this.orbitGroup = new THREE.Group();
    this.orbitGroup.name = 'OrbitGroup';

    this.earthGroup = new THREE.Group();
    this.earthGroup.name = 'EarthGroup';


    this.effectsGroup = new THREE.Group();
    this.effectsGroup.name = 'EffectsGroup';


    this.earthGroup.add(earth);           
    this.orbitGroup.add(this.earthGroup); 

    this.root.add(this.orbitGroup);
    this.root.add(this.effectsGroup);
  }


  public addToEarth(object: THREE.Object3D) {
    this.earthGroup.add(object);
  }

  public addToOrbit(object: THREE.Object3D) {
    this.orbitGroup.add(object);
  }

  public addToEffects(object: THREE.Object3D) {
    this.effectsGroup.add(object);
  }

}
