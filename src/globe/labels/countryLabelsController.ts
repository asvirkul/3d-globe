import type { Controller } from '../../engine/GlobeEngine';
import { CountryLabelInteractions } from './countryLabelsInteractions';
import { CountryLabelsLayer } from './countryLabelsLayer';

export class CountryLabelsController implements Controller {
  constructor(
    private layer: CountryLabelsLayer,
    private interactions: CountryLabelInteractions
  ) {}

  update(delta: number): void {
    this.layer.updateVisibility();
    this.layer.updateOpacity(delta);
    this.layer.updateColor(delta);
  }

  dispose(): void {
    this.layer.dispose();
    this.interactions.dispose();
  }
}
