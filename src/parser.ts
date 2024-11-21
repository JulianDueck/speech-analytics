class Parser {
  private input: string[];
  private currentToken: string | null;
  private currentSpeaker: string | null;

  constructor(inputString: string) {
    this.input = Array.from(inputString);
    this.currentToken = null;
    this.currentSpeaker = null;
  }

  public parse(): [string[], string[]] {
    try {
      this.currentToken = this.getNextToken();
      const [words, speakers] = this.oracion();
      return [words, speakers];
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

  private oracion(): [string[], string[]] {
    if (this.currentToken !== null && this.isSpeakerTag(this.currentToken)) {
      this.processSpeakerTag();
      return this.oracion();
    } else if (this.isLetra(this.currentToken)) {
      const [palabra, speaker] = this.palabra();
      const [words, speakers] = this.cuerpo();
      return [[palabra].concat(words), [speaker].concat(speakers)];
    } else {
      this.simbolo();
      return this.cuerpo();
    }
  }

  private cuerpo(): [string[], string[]] {
    if (this.currentToken === null) {
      return [[], []];
    }
    if (this.isSpeakerTag(this.currentToken)) {
      this.processSpeakerTag();
      return this.cuerpo();
    } else if (this.isLetra(this.currentToken)) {
      const [palabra, speaker] = this.palabra();
      const [words, speakers] = this.cuerpo();
      return [[palabra].concat(words), [speaker].concat(speakers)];
    } else {
      this.simbolo();
      return this.cuerpo();
    }
  }

  private palabra(): [string, string] {
    return [this.letra() + this.cola(), this.currentSpeaker || 'UNKNOWN'];
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
    const symbols = [" ", ",", ".", ";", ":", "¡", "!", "¿", "?", "'", "\"", "(", ")", "\n", "\t", "[", "]", "{", "}", "-", "_", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
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

  private isSpeakerTag(token: string): boolean {
    return token === '[';
  }

  private processSpeakerTag(): void {
    let tag = '';
    this.match('[');
    
    while (this.currentToken !== null && this.currentToken !== ']') {
      tag += this.currentToken;
      this.currentToken = this.getNextToken();
    }
    
    if (this.currentToken === ']') {
      this.match(']');
      this.currentSpeaker = tag;
    }
  }
}

export default Parser;
