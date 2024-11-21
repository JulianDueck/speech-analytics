import Lexema from "./lexema.ts";
import { TokenType, TokenTypeHelper } from "./tokenType.ts";
import { DictLexemas, leerDictlexemas } from "./utils.ts";

class MinimalTokenizer {
  private oracion: string[];
  private dictlexemas: DictLexemas;
  private tokenizedLex: Lexema[];
  private noTokenizedLex: string[];
  private tokenTypesFound: Set<TokenType>;

  private constructor(oracion: string[], dictlexemas: DictLexemas) {
    this.oracion = oracion;
    this.dictlexemas = dictlexemas;
    this.tokenizedLex = [];
    this.noTokenizedLex = [];
    this.tokenTypesFound = new Set<TokenType>();
  }

  static async create(oracion: string[]): Promise<MinimalTokenizer> {
    const dictlexemas = await leerDictlexemas();
    if (!dictlexemas) {
      throw new Error("Failed to load dictionary");
    }
    return new MinimalTokenizer(oracion, dictlexemas);
  }

  get hasSaludo(): boolean {
    return Array.from(this.tokenTypesFound).includes(TokenType.SALUDO);
  }

  get hasDespedida(): boolean {
    return Array.from(this.tokenTypesFound).includes(TokenType.DESPEDIDA);
  }

  get evaluation(): [string, number] {
    const [buenoSum, maloSum, saludoPeso, despedidaPeso] = this.categorizeSumWeights();

    // console.log(`Pesos - Bueno: ${buenoSum}, Malo: ${maloSum}, Saludo: ${saludoPeso}, Despedida: ${despedidaPeso}`);

    const [
      buenoNormalized,
      maloNormalized,
      saludoNormalized,
      despedidaNormalized,
    ] = this.normalizeWeights(buenoSum, maloSum, saludoPeso, despedidaPeso);

    // console.log(`Pesos normalizados - Bueno: ${buenoNormalized}, Malo: ${maloNormalized}, Saludo: ${saludoNormalized}, Despedida: ${despedidaNormalized}`);
    
    const score = this.finalEvaluation(
      buenoNormalized,
      maloNormalized,
      saludoNormalized,
      despedidaNormalized
    );
    
    return [this.mapScoreToCategory(score), score];
  }

  private categorizeSumWeights(): [number, number, number, number] {
    let buenoSum = 0;
    let maloSum = 0;
    let saludoPeso = 0;
    let despedidaPeso = 0;

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
      }
    }

    return [buenoSum, maloSum, saludoPeso, despedidaPeso];
  }

  private normalizeWeights(
    buenoSum: number,
    maloSum: number,
    saludoPeso: number,
    despedidaPeso: number
  ): [number, number, number, number] {
    const total = buenoSum + maloSum + saludoPeso + despedidaPeso;
    if (total === 0) return [0, 0, 0, 0];

    return [
      buenoSum / total,
      maloSum / total,
      saludoPeso / total,
      despedidaPeso / total,
    ];
  }

  private finalEvaluation(
    buenoNormalized: number,
    maloNormalized: number,
    saludoNormalized: number,
    despedidaNormalized: number
  ): number {
    if (!this.hasSaludo) {
      saludoNormalized -= 0.2 * new TokenTypeHelper(TokenType.SALUDO).getDefaultWeight();
    }

    if (!this.hasDespedida) {
      despedidaNormalized -= 0.2 * new TokenTypeHelper(TokenType.SALUDO).getDefaultWeight();
    }

    return (
      buenoNormalized -
      maloNormalized +
      saludoNormalized +
      despedidaNormalized
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
    // Inicializa los arrays para almacenar lexemas tokenizados y no tokenizados
    this.tokenizedLex = [];
    this.noTokenizedLex = [];
    // Objeto para rastrear lexemas procesados y manejar duplicados
    const processedLexemas: { [key: string]: Lexema } = {};

    while (oracionToMap.length > 0) {
      const palabra = oracionToMap[0];
      // Busca la palabra en el diccionario de lexemas
      const dictLexemaEntry = this.dictlexemas[palabra];

      if (dictLexemaEntry) {
        // Obtiene todos los posibles lexemas para esta palabra
        const lexemas = Object.values(dictLexemaEntry);
        // Busca el mejor lexema que coincida con la secuencia actual de palabras
        const lexema = this.buscarMejorMatch(oracionToMap, lexemas);

        if (lexema) {
          if (lexema.id in processedLexemas) {
            // Incrementa el peso del lexema si ya fue procesado anteriormente
            processedLexemas[lexema.id].peso += lexema.pesoO;
          } else {
            // Agrega el nuevo lexema a la lista de tokenizados y lo marca como procesado
            this.tokenizedLex.push(lexema);
            this.tokenTypesFound.add(lexema.token);
            processedLexemas[lexema.id] = lexema;
          }

          // Elimina las palabras procesadas de la oración
          for (let i = 0; i < lexema.length; i++) {
            oracionToMap.shift();
          }
        } else {
          // Si no hay coincidencia, agrega la palabra a no tokenizados
          this.noTokenizedLex.push(oracionToMap.shift()!);
        }
      } else {
        // Si la palabra no está en el diccionario, la agrega a no tokenizados
        this.noTokenizedLex.push(oracionToMap.shift()!);
      }
    }
  }

  /**
   * Busca el mejor lexema que coincida con la oración dada
   * @param oracionToMap - Array de palabras que forman la oración a analizar
   * @param lexemas - Array de lexemas posibles para comparar
   * @returns El lexema más largo que coincide, o null si no hay coincidencias
   */
  private buscarMejorMatch(
    oracionToMap: string[],
    lexemas: Lexema[]
  ): Lexema | null {
    // Une las palabras con guiones bajos para comparar con los IDs de lexemas
    const oracion = oracionToMap.join("_");

    // Filtra los lexemas que están en orden al inicio de la oración
    const searchResults = lexemas.filter((lexema) =>
      this.estaEnOrden(lexema.id, oracion)
    );

    // Si no hay coincidencias, retorna null
    if (searchResults.length === 0) return null;

    // Retorna el lexema más largo entre todas las coincidencias
    return searchResults.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr
    );
  }

  private estaEnOrden(str1: string, str2: string): boolean {
    return str2.startsWith(str1);
  }

  get tokenizedLexemas() {
    return this.tokenizedLex;
  }
}

export default MinimalTokenizer; 