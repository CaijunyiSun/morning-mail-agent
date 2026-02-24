const axios = require("axios");

async function listModels() {
  try {
    const res = await axios.get(
      "https://generativelanguage.googleapis.com/v1/models",
      {
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    console.log(JSON.stringify(res.data, null, 2));

  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

listModels();
