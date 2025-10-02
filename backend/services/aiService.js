import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Generate multiple questions from a prompt
export const generateQuestionsWithGemini = async (prompt, numQuestions = 1) => {
    const formattedPrompt = `
${prompt}.
Generate ${numQuestions} multiple-choice questions with 4 options each.
Return JSON array like this:
[
  {
    "text": "Question text",
    "options": [
      { "id": "A", "text": "Option A" },
      { "id": "B", "text": "Option B" },
      { "id": "C", "text": "Option C" },
      { "id": "D", "text": "Option D" }
    ],
    "correctOptionId": "A",
    "explanation": "Short explanation"
  }
]
Do not include any extra text or markdown.
`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: formattedPrompt }] }],
            },
            { headers: { "Content-Type": "application/json" } }
        );

        let modelText =
            response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!modelText) throw new Error("No response from AI");

        modelText = modelText.replace(/```json|```/g, "").trim();

        const questions = JSON.parse(modelText);
        return questions;
    } catch (error) {
        console.error(
            "AI generation error:",
            error.response?.data || error.message
        );
        throw new Error("Failed to generate questions");
    }
};
