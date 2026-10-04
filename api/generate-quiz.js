import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {

  // Allow requests from your GitHub Pages website
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://puspakamalm-hue.github.io"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Browser CORS preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      topic,
      difficulty,
      questionCount
    } = req.body || {};

    if (!topic) {
      return res.status(400).json({
        error: "Please enter a quiz topic."
      });
    }

    const count = Math.min(
      Math.max(
        parseInt(questionCount) || 5,
        1
      ),
      15
    );

    const level =
      difficulty || "Medium";


    const response =
      await client.responses.create({

        model: "gpt-6-luna",

        input: [
          {
            role: "system",

            content:
              "You are Quizly AI, an educational quiz generator. Create accurate multiple-choice quizzes. Return only valid JSON."
          },

          {
            role: "user",

            content: `
Create a ${count}-question multiple-choice quiz.

Topic: ${topic}

Difficulty: ${level}

Return ONLY valid JSON in exactly this format:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Short explanation"
    }
  ]
}

Rules:

1. Create exactly ${count} questions.
2. Every question must have exactly 4 options.
3. "answer" must be the zero-based index of the correct answer.
4. Do not repeat questions.
5. Make the questions appropriate for ${level} difficulty.
6. Make sure the correct answers are accurate.
7. Keep explanations short.
8. Return JSON only.
`
          }
        ]

      });


    const text =
      response.output_text;


    let quiz;

    try {

      quiz =
        JSON.parse(text);

    } catch (parseError) {

      console.error(
        "JSON parsing error:",
        parseError
      );

      console.error(
        "AI output:",
        text
      );

      return res.status(500).json({
        error:
          "The AI returned an invalid quiz format."
      });

    }


    if (
      !quiz.questions ||
      !Array.isArray(quiz.questions)
    ) {

      return res.status(500).json({
        error:
          "The AI returned an invalid quiz."
      });

    }


    return res.status(200).json(
      quiz
    );


  } catch (error) {

    console.error(
      "OpenAI error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Unable to generate quiz."
    });

  }

}
