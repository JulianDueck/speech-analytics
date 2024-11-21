import Lexema from "./lexema.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import {TokenType} from "./tokenType.ts";

type LexemaMap = Map<string, Lexema>;
type DataMap = Map<string, LexemaMap>;

export type DictLexemas = {
  [key: string]: {
    [key: string]: Lexema;
  };
};

interface LexemaData {
  lexemas: string[];
  token: string;
  peso: number;
}

interface JsonData {
  [key: string]: {
    [key: string]: LexemaData;
  };
}

const FILE = "../data/dictlexemas.json";

export async function leerJson(filePath: string): Promise<unknown | null> {
  try {
    // Lee el contenido del archivo usando la API de Deno
    const fileContent = await Deno.readTextFile(filePath);

    // Analiza el contenido JSON y lo convierte a un objeto JavaScript
    return JSON.parse(fileContent);
  } catch (error) {
    // Maneja diferentes tipos de errores que pueden ocurrir durante la lectura
    if (error instanceof Deno.errors.NotFound) {
      console.error(
        `Error al leer el archivo: Archivo no encontrado - ${filePath}`
      );
    } else if (error instanceof SyntaxError) {
      // Error al parsear el JSON si tiene formato inválido
      console.error(`Error al parsear el archivo JSON: ${error.message}`);
    } else {
      // Cualquier otro error inesperado
      console.error(`Error inesperado: ${error}`);
    }
    return null;
  }
}

/**
 * Convierte una cadena de texto que representa un tipo de token en su equivalente TokenType
 * @param tokenStr - La cadena de texto que representa el tipo de token
 * @returns El tipo de token (TokenType) correspondiente
 * @throws Error si el tipo de token no es válido
 */
function getTokenType(tokenStr: string): TokenType {
  // Objeto que mapea las cadenas de texto a sus tipos de token correspondientes
  const tokenTypes = {
    BUENO: TokenType.BUENO,      // Token para palabras positivas
    MALO: TokenType.MALO,        // Token para palabras negativas 
    NEUTRAL: TokenType.NEUTRAL,  // Token para palabras neutrales
    SALUDO: TokenType.SALUDO,    // Token para saludos
    DESPEDIDA: TokenType.DESPEDIDA, // Token para despedidas
  };

  // Obtiene el tipo de token del mapeo
  const tokenType = tokenTypes[tokenStr as keyof typeof tokenTypes];
  if (!tokenType) {
    throw new Error(`Tipo de token inválido: ${tokenStr}`);
  }

  return tokenType;
}

export async function leerDictlexemas(): Promise<DictLexemas | null> {
  try {
    // Obtiene el directorio del archivo actual
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const filePath = join(scriptDir, FILE);

    // Lee y analiza el archivo JSON
    const data = (await leerJson(filePath)) as JsonData | null;

    if (!data) {
      console.error("No se pudo leer el archivo de dictlexemas");
      return null;
    }

    // Inicializa el diccionario de lexemas que se retornará
    const dictlexemas: DictLexemas = {};

    // Procesa cada grupo de lexemas del archivo JSON
    // Un grupo está identificado por su lexid (ej: "saludos", "despedidas", etc)
    for (const [lexid, value] of Object.entries(data)) {
      const lexemas: { [key: string]: Lexema } = {};

      // Procesa cada lexema individual dentro del grupo
      // Cada lexema tiene una clave única, sus palabras relacionadas, 
      // un tipo de token y un peso
      for (const [lexemaKey, item] of Object.entries(value)) {
        const tokenType = getTokenType(item.token);

        // Crea una nueva instancia de Lexema con los datos del archivo
        const lexema = new Lexema(item.lexemas, tokenType, item.peso);
        lexemas[lexemaKey] = lexema;
      }

      dictlexemas[lexid] = lexemas;
    }
    return dictlexemas;
  } catch (error) {
    console.error("Error al cargar el diccionario de lexemas:", error);
    return null;
  }
}
