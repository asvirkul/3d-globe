import { CountryLabelsLayer } from './countryLabelsLayer';
import type { Controller } from '../../engine/GlobeEngine';

export class CountryLabelsController implements Controller {
  constructor(private layer: CountryLabelsLayer) {}

  update(delta: number): void {
    this.layer.updateVisibility();
    this.layer.updateOpacity(delta);
    this.layer.updateColor(delta);
  }

  dispose(): void {
    this.layer.dispose();
  }
}
