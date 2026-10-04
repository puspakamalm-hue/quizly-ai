import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { topic, difficulty, questionCount } = req.body || {};

    if (!topic) {
      return res.status(400).json({
        error: "Please enter a quiz topic.",
      });
    }

    const count = Math.min(
      Math.max(parseInt(questionCount) || 5, 1),
      20
    );

    const level = difficulty || "Medium";

    const response = await client.responses.create({
      model: "gpt-6-luna",
      input: [
        {
          role: "system",
          content:
            "You are Quizly AI, a quiz-generation assistant. Create accurate, educational multiple-choice quizzes. Return ONLY valid JSON with no markdown.",
        },
        {
          role: "user",
          content: `Create a ${count}-question multiple-choice quiz about "${topic}".

Difficulty: ${level}

Return exactly this JSON structure:

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
- Create exactly ${count} questions.
- Each question must have exactly 4 options.
- "answer" must be the zero-based index of the correct option.
- Make the questions appropriate for the selected difficulty.
- Avoid duplicate questions.
- Make sure the correct answer is actually correct.
- Return JSON only.`,
        },
      ],
    });

    const text = response.output_text;

    let quiz;

    try {
      quiz = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid quiz data.",
      });
    }

    if (
      !quiz.questions ||
      !Array.isArray(quiz.questions)
    ) {
      return res.status(500).json({
        error: "Invalid quiz format returned by AI.",
      });
    }

    return res.status(200).json(quiz);

  } catch (error) {
    console.error("Quiz generation error:", error);

    return res.status(500).json({
      error: "Unable to generate quiz. Please try again.",
    });
  }
}
