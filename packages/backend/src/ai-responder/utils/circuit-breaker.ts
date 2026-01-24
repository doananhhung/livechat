import { Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export type StateChangeCallback = (
  name: string,
  from: CircuitState,
  to: CircuitState
) => void;

export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private failures = 0;
  private state: CircuitState = CircuitState.CLOSED;
  private nextAttempt: number | null = null;

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 30000, // 30 seconds
    private readonly onStateChange?: StateChangeCallback
  ) {}

  public getState(): CircuitState {
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttempt && Date.now() < this.nextAttempt) {
        throw new Error(
          `CircuitBreaker [${this.name}] is OPEN. Retrying in ${(this.nextAttempt - Date.now()) / 1000}s`
        );
      }
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    if (this.state !== CircuitState.CLOSED) {
      this.transitionTo(CircuitState.CLOSED);
    }
    this.failures = 0;
    this.nextAttempt = null;
  }

  private onFailure(error: any) {
    this.failures++;
    this.logger.warn(
      `CircuitBreaker [${this.name}] failure ${this.failures}/${this.failureThreshold}: ${error.message}`
    );

    if (
      this.failures >= this.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.transitionTo(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }

  private transitionTo(newState: CircuitState) {
    const oldState = this.state;
    this.logger.log(
      `CircuitBreaker [${this.name}] state change: ${oldState} -> ${newState}`
    );
    this.state = newState;

    if (this.onStateChange) {
      this.onStateChange(this.name, oldState, newState);
    }
  }
}