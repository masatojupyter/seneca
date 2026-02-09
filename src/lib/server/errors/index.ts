export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class PaymentError extends AppError {
  constructor(
    message: string,
    public xrplErrorCode?: string
  ) {
    super(message, 502, 'PAYMENT_ERROR');
    this.name = 'PaymentError';
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export class InsufficientBalanceError extends PaymentError {
  constructor(requiredXrp: number, availableXrp: number) {
    super(
      `残高不足です。必要: ${requiredXrp} XRP, 利用可能: ${availableXrp} XRP`,
      'tecUNFUNDED_PAYMENT'
    );
    this.name = 'InsufficientBalanceError';
    Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
  }
}

export class InvalidDestinationError extends PaymentError {
  constructor(address: string) {
    super(
      `送金先アドレスがXRPL上でアクティベートされていません: ${address}`,
      'tecNO_DST'
    );
    this.name = 'InvalidDestinationError';
    Object.setPrototypeOf(this, InvalidDestinationError.prototype);
  }
}

export class NoTrustlineError extends PaymentError {
  constructor(address: string, currency: string) {
    super(
      `送金先アドレスに${currency}のトラストラインが設定されていません: ${address}`,
      'tecNO_LINE'
    );
    this.name = 'NoTrustlineError';
    Object.setPrototypeOf(this, NoTrustlineError.prototype);
  }
}

export class TrustlineLimitError extends PaymentError {
  constructor(address: string, currency: string) {
    super(
      `送金先アドレスの${currency}トラストライン上限が不足しています: ${address}`,
      'tecPATH_DRY'
    );
    this.name = 'TrustlineLimitError';
    Object.setPrototypeOf(this, TrustlineLimitError.prototype);
  }
}
