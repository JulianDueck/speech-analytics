enum TokenType {
  BUENO = "BUENO",
  MALO = "MALO",
  NEUTRAL = "NEUTRAL",
  SALUDO = "SALUDO",
  DESPEDIDA = "DESPEDIDA",
}

class TokenTypeHelper {
  constructor(private readonly value: TokenType) {}

  static getTitle(type: TokenType): string {
    return TokenType[type];
  }

  get title(): string {
    return this.value;
  }

  getDefaultWeight(): number {
    switch (this.value) {
      case TokenType.BUENO:
        return 2;
      case TokenType.MALO:
        return 4;
      case TokenType.SALUDO:
      case TokenType.DESPEDIDA:
        return 3;
      default:
        return 0;
    }
  }

  getValue(): TokenType {
    return this.value;
  }
}

export { TokenType, TokenTypeHelper };