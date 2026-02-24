const axios = require("axios");

async function analyzeEmails(text) {
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: `
You are an intelligent email assistant.

For the following unread emails:

1) Categorize into:
   - Investment
   - Personal
   - Promotion / Newsletter

2) Give each email a priority score (1-5).

3) For high priority emails (score 4-5), generate a short reply draft.

Return clean formatted output.

Emails:
${text}
`
              }
            ]
          }
        ]
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

module.exports = analyzeEmails;