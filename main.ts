import MinimalTokenizer from "./src/minimalTokenizer.ts";
import Parser from "./src/parser.ts";

async function main() {
  try {
    const inputText = await Deno.readTextFile("input/input.txt");

    const parser = new Parser(inputText);
    const [parsedWords, speakers] = parser.parse();

    const tokenizer = await MinimalTokenizer.create(parsedWords, speakers);
    tokenizer.buscarLexemas();

    console.log("\nEvaluación:");
    console.log(`Tiene saludo: ${tokenizer.hasSaludo ? "Si" : "No"}`);
    console.log(`Tiene despedida: ${tokenizer.hasDespedida ? "Si" : "No"}`);
    console.log(`Tiene identificación del cliente: ${tokenizer.hasIdentificacion ? "Si" : "No"}`);

    const [message, score] = tokenizer.evaluation;
    console.log(`\nEvaluación final: ${message}`);
    console.log(`(${score.toPrecision(2)})`);

    console.log("\nTokenized Lexemas:");
    for (const lex of tokenizer.tokenizedLexemas) {
      console.log(lex.toString());
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  main();
} 