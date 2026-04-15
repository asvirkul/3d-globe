import type { Controller } from '../../engine/GlobeEngine';
import { CountryLabelsLayer } from './countryLabelsLayer';

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
