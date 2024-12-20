import Lexema from "./lexema.ts";
import { TokenType, TokenTypeHelper } from "./tokenType.ts";
import { DictLexemas, leerDictlexemas } from "./utils.ts";

class Sentimiento {
  private oracion: string[];
  private speakers: string[];
  private dictlexemas: DictLexemas;
  private tokenizedLex: Lexema[];
  private noTokenizedLex: string[];
  private tokenTypesFound: Set<TokenType>;

  private constructor(oracion: string[], speakers: string[], dictlexemas: DictLexemas) {
    this.oracion = oracion;
    this.speakers = speakers;
    this.dictlexemas = dictlexemas;
    this.tokenizedLex = [];
    this.noTokenizedLex = [];
    this.tokenTypesFound = new Set<TokenType>();
  }

  static async create(oracion: string[], speakers: string[]): Promise<Sentimiento> {
    const dictlexemas = await leerDictlexemas();
    if (!dictlexemas) {
      throw new Error("Failed to load dictionary");
    }
    return new Sentimiento(oracion, speakers, dictlexemas);
  }

  get hasSaludo(): boolean {
    return Array.from(this.tokenTypesFound).includes(TokenType.SALUDO);
  }

  get hasDespedida(): boolean {
    return Array.from(this.tokenTypesFound).includes(TokenType.DESPEDIDA);
  }

  get hasIdentificacion(): boolean {
    return this.tokenizedLex.some(
      lex => lex.token === TokenType.IDENTIFICACION && lex.speaker === "Orador 2"
    );
  }

  get hasRudo(): boolean {
    return this.tokenizedLex.some(
      lex => lex.token === TokenType.RUDO && lex.speaker === "Orador 2"
    );
  }

  get palabrasPositivas(): number {
    return this.tokenizedLex.filter(lex => lex.token === TokenType.BUENO).length;
  }

  get palabrasNegativas(): number {
    return this.tokenizedLex.filter(lex => lex.token === TokenType.MALO).length;
  }

  get palabraMasPositiva(): [string, number] {
    const lexema = this.tokenizedLex.filter(lex => lex.token === TokenType.BUENO).reduce((prev, curr) => prev.peso > curr.peso ? prev : curr);
    return [lexema.lexemas.join(" "), lexema.peso];
  }

  get palabraMasNegativa(): [string, number] {
    const lexema = this.tokenizedLex.filter(lex => lex.token === TokenType.MALO).reduce((prev, curr) => prev.peso > curr.peso ? prev : curr);
    return [lexema.lexemas.join(" "), lexema.peso];
  }

  get evaluation(): [string, number] {
    const [buenoSum, maloSum, saludoPeso, despedidaPeso, identificacionPeso, rudoPeso] = this.categorizeSumWeights();

    // console.log(`Pesos - Bueno: ${buenoSum}, Malo: ${maloSum}, Saludo: ${saludoPeso}, Despedida: ${despedidaPeso}, Identificación: ${identificacionPeso}, Rudo: ${rudoPeso}`);

    const [
      buenoNormalized,
      maloNormalized,
      saludoNormalized,
      despedidaNormalized,
      identificacionNormalized,
      rudoNormalized
    ] = this.normalizeWeights(buenoSum, maloSum, saludoPeso, despedidaPeso, identificacionPeso, rudoPeso);

    // console.log(`Pesos normalizados - Bueno: ${buenoNormalized}, Malo: ${maloNormalized}, Saludo: ${saludoNormalized}, Despedida: ${despedidaNormalized}, Identificación: ${identificacionNormalized}, Rudo: ${rudoNormalized}`);
    
    const score = this.finalEvaluation(
      buenoNormalized,
      maloNormalized,
      saludoNormalized,
      despedidaNormalized,
      identificacionNormalized,
      rudoNormalized
    );
    
    return [this.mapScoreToCategory(score), score];
  }

  private categorizeSumWeights(): [number, number, number, number, number, number] {
    let buenoSum = 0;
    let maloSum = 0;
    let saludoPeso = 0;
    let despedidaPeso = 0;
    let identificacionPeso = 0;
    let rudoPeso = 0;
    for (const lexema of this.tokenizedLex) {
      const tokenHelper = new TokenTypeHelper(lexema.token);
      const defaultWeight = tokenHelper.getDefaultWeight();

      switch (lexema.token) {
        case TokenType.BUENO:
          buenoSum += lexema.peso * defaultWeight;
          break;
        case TokenType.MALO:
          maloSum += lexema.peso * defaultWeight;
          break;
        case TokenType.SALUDO:
          saludoPeso += lexema.peso * defaultWeight;
          break;
        case TokenType.DESPEDIDA:
          despedidaPeso += lexema.peso * defaultWeight;
          break;
        case TokenType.IDENTIFICACION:
          identificacionPeso += lexema.peso * defaultWeight;
          break;
        case TokenType.RUDO:
          rudoPeso += lexema.peso * defaultWeight;
          break;
      }
    }

    return [buenoSum, maloSum, saludoPeso, despedidaPeso, identificacionPeso, rudoPeso];
  }

  private normalizeWeights(
    buenoSum: number,
    maloSum: number,
    saludoPeso: number,
    despedidaPeso: number,
    identificacionPeso: number,
    rudoPeso: number
  ): [number, number, number, number, number, number] {
    const total = buenoSum + maloSum + saludoPeso + despedidaPeso + identificacionPeso + rudoPeso;
    if (total === 0) return [0, 0, 0, 0, 0, 0];

    return [
      buenoSum / total,
      maloSum / total,
      saludoPeso / total,
      despedidaPeso / total,
      identificacionPeso / total,
      rudoPeso / total
    ];
  }

  private finalEvaluation(
    buenoNormalized: number,
    maloNormalized: number,
    saludoNormalized: number,
    despedidaNormalized: number,
    identificacionNormalized: number,
    rudoNormalized: number
  ): number {
    if (!this.hasSaludo) {
      saludoNormalized -= 0.1 * new TokenTypeHelper(TokenType.SALUDO).getDefaultWeight();
    }

    if (!this.hasDespedida) {
      despedidaNormalized -= 0.1 * new TokenTypeHelper(TokenType.SALUDO).getDefaultWeight();
    }

    if (this.hasRudo) {
      rudoNormalized -= 0.3 * new TokenTypeHelper(TokenType.RUDO).getDefaultWeight();
    }

    return (
      buenoNormalized -
      maloNormalized +
      saludoNormalized +
      despedidaNormalized +
      identificacionNormalized -
      rudoNormalized
    );
  }

  private mapScoreToCategory(score: number): string {
    if (score <= -0.5) return "1 MUY_MALA";
    if (score <= -0.1) return "2 MALA";
    if (score <= 0.1) return "3 NEUTRA";
    if (score <= 0.5) return "4 BUENA";
    return "5 MUY_BUENA";
  }

  /**
   * Busca y procesa los lexemas en la oración
   * Analiza cada palabra de la oración y la compara con el diccionario de lexemas
   * Mantiene un registro de lexemas procesados para manejar duplicados
   */
  buscarLexemas(): void {
    // Crea una copia de la oración para procesarla
    const oracionToMap = [...this.oracion];
    const speakersToMap = [...this.speakers];
    // Inicializa los arrays para almacenar lexemas tokenizados y no tokenizados
    this.tokenizedLex = [];
    this.noTokenizedLex = [];
    // Objeto para rastrear lexemas procesados y manejar duplicados
    const processedLexemas: { [key: string]: Lexema } = {};
    let counter = 0;

    while (oracionToMap.length > 0) {
      const palabra = oracionToMap[0];
      // Busca la palabra en el diccionario de lexemas
      const dictLexemaEntry = this.dictlexemas[palabra];      

      if (dictLexemaEntry) {
        // Obtiene todos los posibles lexemas para esta palabra
        const lexemas = Object.values(dictLexemaEntry);
        lexemas.forEach(lexema => lexema.speaker = speakersToMap[counter]);
        // Busca el mejor lexema que coincida con la secuencia actual de palabras
        const lexema = this.buscarMejorMatch(oracionToMap, lexemas);

        if (lexema) {
          if (lexema.id in processedLexemas) {
            // Si es el mismo orador, incrementa el peso
            if (processedLexemas[lexema.id].speaker === speakersToMap[counter]) {
              processedLexemas[lexema.id].peso += lexema.pesoO;
            } else {
              // Si es diferente orador, agrega una nueva entrada
              lexema.speaker = speakersToMap[counter];
              this.tokenizedLex.push(lexema);
              this.tokenTypesFound.add(lexema.token);
              processedLexemas[lexema.id + "_" + speakersToMap[counter]] = lexema;
            }
          } else {
            // Agrega el nuevo lexema a la lista de tokenizados y lo marca como procesado
            lexema.speaker = speakersToMap[counter];
            this.tokenizedLex.push(lexema);
            this.tokenTypesFound.add(lexema.token);
            processedLexemas[lexema.id] = lexema;
          }

          // Elimina las palabras procesadas de la oración
          for (let i = 0; i < lexema.length; i++) {
            oracionToMap.shift();
            counter++;
          }
        } else {
          // Si no hay coincidencia, agrega la palabra a no tokenizados
          this.noTokenizedLex.push(oracionToMap.shift()!);
          counter++;
        }
      } else {
        // Si la palabra no está en el diccionario, la agrega a no tokenizados
        this.noTokenizedLex.push(oracionToMap.shift()!);
        counter++;
      }
    }
  }

  /**
   * Busca el mejor lexema que coincida con la oración dada
   * @param oracionToMap - Array de palabras que forman la oración a analizar
   * @param speakersToMap - Array de oradores que forman la oración a analizar
   * @param lexemas - Array de lexemas posibles para comparar
   * @returns El lexema más largo que coincide, o null si no hay coincidencias
   */
  private buscarMejorMatch(
    oracionToMap: string[],
    lexemas: Lexema[]
  ): Lexema | null {
    const oracion = oracionToMap.join("_");
    const searchResults = lexemas.filter((lexema) =>
      this.estaEnOrden(lexema.id, oracion)
    );

    if (searchResults.length === 0) return null;

    const bestMatch = searchResults.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr
    );

    return new Lexema(
      bestMatch.lexemas,
      bestMatch.token,
      bestMatch.peso,
      bestMatch.speaker
    );
  }

  private estaEnOrden(str1: string, str2: string): boolean {
    return str2.startsWith(str1);
  }

  get tokenizedLexemas() {
    return this.tokenizedLex;
  }
}

export default Sentimiento; 