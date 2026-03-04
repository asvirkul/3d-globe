import * as THREE from 'three';
import type { Controller } from '../../engine/GlobeEngine';
import type { CountriesMap } from '../borders/types';
import { xyz2lon } from '../../engine/utils/geo';
import { findCountryByLatLon } from '../borders/countryLookup';


type countryPickHandlers = {
    onPick?: (iso : string | null) => void;
}

export class CountryPickController implements Controller {

    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private abort = new AbortController();
    private downX = 0;
    private downY = 0;
    private readonly tapThreshold = 6;
    private isPointerDown = false;

    constructor (
        private dom: HTMLElement,
        private earthMesh: THREE.Mesh,
        private camera: THREE.PerspectiveCamera,
        private countries: CountriesMap,
        private handlers: countryPickHandlers = {}
    ) {
        dom.addEventListener('pointerdown', this.onDown, { signal: this.abort.signal });
        dom.addEventListener('pointerup', this.onUp, { signal: this.abort.signal });
        dom.addEventListener('pointercancel', this.onCancel, { signal: this.abort.signal });
    }

    public update(_delta: number): void {}

    public dispose(): void {
        this.abort.abort()
    }

    private onCancel = () => {
        this.isPointerDown = false;
    }

    private onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        
        this.isPointerDown = true;
        this.downX = e.clientX;
        this.downY = e.clientY;
    }

    private onUp = (e: PointerEvent) => {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;
        const dx = e.clientX - this.downX;
        const dy = e.clientY - this.downY;
        const moved = Math.hypot(dx, dy);

        if (moved <= this.tapThreshold) {
            const iso = this.pickIso(e.clientX, e.clientY);
            this.handlers.onPick?.(iso);
        }
    }

    private pickIso(clientX: number, clientY: number): string | null {
        const rect = this.dom.getBoundingClientRect();

        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const hits = this.raycaster.intersectObject(this.earthMesh, false);
        if (hits.length === 0) return null;
        const hit = hits[0];
        const { lat, lon } = xyz2lon(hit.point)
        const iso = findCountryByLatLon(lat, lon, this.countries);
        return iso;
    }
}