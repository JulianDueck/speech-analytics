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
  public speaker?: string;

  constructor(lexemas: string[], token: TokenType, peso: number, speaker?: string) {
    this.id = lexemas.join("_");
    this.lexemas = lexemas;
    this.token = token;
    this.peso = peso;
    this.pesoO = peso;
    this.length = lexemas.length;
    this.speaker = speaker;
  }

  toString(): string {
    return `Lexema(${this.lexemas.join(" ")})[${this.speaker}]: ${TokenTypeHelper.getTitle(this.token)}`;
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