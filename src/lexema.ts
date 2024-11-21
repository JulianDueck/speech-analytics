import { TokenType, TokenTypeHelper } from "./tokenType.ts";

interface LexemaData {
  id: string;
  lexemas: string[];
  token: string;
  peso: number;
  length: number;
}

class Lexema {
  public readonly id: string;
  public readonly lexemas: string[];
  public readonly token: TokenType;
  public peso: number;
  public pesoO: number;
  public readonly length: number;

  constructor(lexemas: string[], token: TokenType, peso: number) {
    this.id = lexemas.join("_");
    this.lexemas = lexemas;
    this.token = token;

    if (token === TokenType.NEUTRAL) {
      this.peso = 0;
      this.pesoO = 0;
    } else {
      this.peso = peso;
      this.pesoO = peso;
    }

    this.length = lexemas.length;
  }

  toString(): string {
    return `Lexema(${this.lexemas.join(" ")}): ${TokenTypeHelper.getTitle(this.token)}`;
  }

  get root(): string {
    return this.lexemas[0];
  }

  toObject(): LexemaData {
    return {
      id: this.id,
      lexemas: this.lexemas,
      token: this.token,
      peso: this.peso,
      length: this.length,
    };
  }
}

export default Lexema; 