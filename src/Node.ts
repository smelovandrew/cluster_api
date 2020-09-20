export type TMessageType = 'data' | 'master' | 'processed' | 'active'
export type TMessage = {id: number; type: TMessageType; value?: number}

export class Node {
  private timeoutId: NodeJS.Timeout | null = null;
  private _isMaster: boolean = false;
  private _isActive: boolean = false;

  get type(): string {
    return this._isMaster ? 'Master' : 'Worker'
  }
  get isActive(): boolean {
    return this._isActive;
  }
  set isActive(state: boolean) {
    this._isActive = state;
    if (!state && this._isMaster) {
      this.isMaster = false;
    }
  }
  get isMaster(): boolean {
    return this._isMaster;
  }
  set isMaster(state: boolean) {
    if (state !== this._isMaster) {
      this._isMaster = state;
      this.timeoutId && clearInterval(this.timeoutId);
      if (state) {
        this.timeoutId = setInterval(() => {
          const message: TMessage = {
            type: 'data',
            id: this.id,
            value: Math.round(Math.random() * 100000)
          }
          process.send!(message)
        }, 5000)
      }
    }
  }

  public constructor(public id: number, isMaster: boolean = false ) {
    this.isActive = true;
    this.isMaster = isMaster;
  }

  public process(value: number) {
    console.log(`${this.type} ${this.id} received value: ${value}`);
    const message: TMessage = {
      type: 'processed',
      id: this.id,
    }
    process.send!(message)
  }
}