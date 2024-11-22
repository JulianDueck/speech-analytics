import Sentimiento from "./src/sentimiento.ts";
import Tokenizer from "./src/tokenizer.ts";

async function main() {
  try {
    const inputText = await Deno.readTextFile("input/input.txt");

    const tokenizer = new Tokenizer(inputText);
    const [parsedWords, speakers] = tokenizer.parse();

    const sentimiento = await Sentimiento.create(parsedWords, speakers);
    sentimiento.buscarLexemas();

    console.log("\nEvaluación:");
    console.log(`Tiene saludo: ${sentimiento.hasSaludo ? "Si" : "No"}`);
    console.log(`Tiene despedida: ${sentimiento.hasDespedida ? "Si" : "No"}`);
    console.log(`Tiene identificación del cliente: ${sentimiento.hasIdentificacion ? "Si" : "No"}`);
    console.log(`Uso de palabras rudas: ${sentimiento.hasRudo ? "Si" : "No"}`);

    const [message, score] = sentimiento.evaluation;
    console.log(`\nEvaluación final: ${message}`);
    console.log(`(${score.toPrecision(2)})`);

    console.log("\nTokenized Lexemas:");
    for (const lex of sentimiento.tokenizedLexemas) {
      console.log(lex.toString());
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  main();
} 