import type { Controller } from '../../engine/GlobeEngine';
import { CountryPinsLayer } from './countryPinsLayer';

export class CountryPinsController implements Controller {
  constructor(private layer: CountryPinsLayer) {}

  public update(delta: number): void {
    this.layer.updateVisibility();
    this.layer.updateOpacity(delta);
  }

  public dispose(): void {
    this.layer.dispose();
  }
}
