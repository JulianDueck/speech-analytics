class Parser {
  private input: string[];
  private currentToken: string | null;

  constructor(inputString: string) {
    this.input = Array.from(inputString);
    this.currentToken = null;
  }

  public parse(): string[] {
    try {
      this.currentToken = this.getNextToken();
      return this.oracion();
    } catch (e) {
      console.error(e);
      throw new Error("La oración no forma parte de la lengua española");
    }
  }

  public loadInput(inputString: string): void {
    this.input = Array.from(inputString);
    this.currentToken = null;
  }

  private getNextToken(): string | null {
    if (this.input.length > 0) {
      return this.input.shift() || null;
    } else {
      return null;
    }
  }

  private match(token: string): void {
    if (this.currentToken === token) {
      this.currentToken = this.getNextToken();
    } else {
      throw new Error(`Caracter invalido: se esperaba: '${token}'`);
    }
  }

  private oracion(): string[] {
    if (this.isLetra(this.currentToken)) {
      return [this.palabra()].concat(this.cuerpo());
    } else {
      this.simbolo();
      return this.cuerpo();
    }
  }

  private cuerpo(): string[] {
    if (this.currentToken === null) {
      return [];
    }
    if (this.isLetra(this.currentToken)) {
      return [this.palabra()].concat(this.cuerpo());
    } else {
      this.simbolo();
      return this.cuerpo();
    }
  }

  private palabra(): string {
    return this.letra() + this.cola();
  }

  private cola(): string {
    if (this.currentToken === null) {
      return "";
    }
    if (this.isLetra(this.currentToken)) {
      return this.letra() + this.cola();
    } else {
      return this.simbolo();
    }
  }

  private letra(): string {
    const lowerCaseMap: { [key: string]: string } = {
      A: "a",
      B: "b",
      C: "c",
      D: "d",
      E: "e",
      F: "f",
      G: "g",
      H: "h",
      I: "i",
      J: "j",
      K: "k",
      L: "l",
      M: "m",
      N: "n",
      Ñ: "ñ",
      O: "o",
      P: "p",
      Q: "q",
      R: "r",
      S: "s",
      T: "t",
      U: "u",
      V: "v",
      W: "w",
      X: "x",
      Y: "y",
      Z: "z",
      Á: "á",
      É: "é",
      Í: "í",
      Ó: "ó",
      Ú: "ú",
      Ü: "ü",
    };

    const validLetters = "abcdefghijklmnñopqrstuvwxyzáéíóúü";

    if (!this.currentToken) {
      throw new Error("No current token available");
    }

    const token = this.currentToken.toLowerCase();
    if (lowerCaseMap[this.currentToken] || validLetters.includes(token)) {
      const result = lowerCaseMap[this.currentToken] || token;
      this.match(this.currentToken);
      return result;
    }

    throw new Error(`Invalid character: ${this.currentToken}`);
  }

  private simbolo(): string {
    const symbols = [" ", ",", ".", ";", ":", "¡", "!", "¿", "?", "'", "\"", "(", ")", "\n", "\t", "[", "]", "{", "}", "-", "_"];
    if (!this.currentToken) {
      throw new Error("No current token available");
    }

    if (symbols.includes(this.currentToken) || this.currentToken === '\n' || this.currentToken === '\r') {
      this.match(this.currentToken);
      return "";
    }

    throw new Error(`Invalid symbol: ${this.currentToken}`);
  }

  private isLetra(char: string | null): boolean {
    if (!char) return false;
    return /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(char);
  }
}

export default Parser;
