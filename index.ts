import OpenAI from "openai";
import { config } from "dotenv";
import express, { Request, Response } from "express";

config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `Você é um sistema utilizado para auxiliar no aprendizado de química. Irei te informar um conjunto de átomos e/ou moléculas e você deverá me dizer qual será o resultado dessa reação química, sob as condições mais comuns que esses componentes são encontrados, a não ser quando eu especificar as condições.

O formato da entrada que eu darei será uma única linha contendo uma fórmula. Por exemplo, para juntar uma molécula de água com uma molécula de oxigênio, a entrada será assim:

H2O+O2

Sua resposta deve conter 4 linhas:
  1) a fórmula molecular do resultado da reação, no mesmo formato da entrada;
  2) O nome da molécula/substância gerada (sem descrições ou adendos);
  3) Uma descrição de no máximo 150 caracteres da molécula;
  4) Um emoji unicode representando a molécula.

Não numere as linhas, mantenha a resposta apenas com o conteúdo indicado. Caso não haja reação, retorne apenas "null".`;

function parseContent(content: string) {
  if (!content || content === "null") return null;

  const [formula, name, description, emoji] = content
    .split("\n")
    .map((line) => line.trim());

  return { formula, name, description, emoji };
}

type ReactionResult = {
  formula: string;
  name: string;
  description: string;
  emoji: string;
};

async function getReaction(formula: string): Promise<ReactionResult | null> {
  if (!formula) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: systemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: formula,
            },
          ],
        },
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
    });

    const result = parseContent(response.choices[0].message.content ?? "");

    if (result) {
      return result;
    } else {
      console.log("No message content: ", response.choices[0].message.content);
      console.log("Response: ", response);
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}

type ReactionQuery = {
  q: string;
};

app.get<"/", {}, {}, {}, ReactionQuery>(
  "/",
  async (req: Request<{}, {}, {}, ReactionQuery>, res: Response) => {
    try {
      const formula = req.query.q;

      console.log(`Received formula "${formula}"`);

      if (!formula) {
        res.status(400).json({ message: "Fórmula inválida." });
        return;
      }

      const result = await getReaction(formula);
      if (!result) {
        res.status(200).json({ message: "Sem reação." });
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Falha ao processar reação.",
      });
    }
  }
);

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});

export default app;
