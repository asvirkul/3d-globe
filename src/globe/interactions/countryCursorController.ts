import { Controller } from '../../engine/GlobeEngine';
import { CountryCursorSync } from './countryCursorSync';

export class CountryCursorController implements Controller {
  constructor(private cursorSync: CountryCursorSync) {}

  public update(): void {}

  public dispose(): void {
    this.cursorSync.dispose();
  }
}
