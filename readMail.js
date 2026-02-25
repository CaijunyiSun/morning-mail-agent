console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);

const { google } = require("googleapis");
const analyzeEmails = require("./summarize");
const axios = require("axios");
const cron = require("node-cron");

// ========= ENV =========
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ========= OAuth =========
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// ========= Telegram Sender =========
async function sendTelegram(message) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }
  );
}

// ========= 格式优化 =========
function formatDailyReport(content) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return `
📬 *Morning AI Mail Brief*
🗓 ${today}

━━━━━━━━━━━━━━━━━━

${content}

━━━━━━━━━━━━━━━━━━
🤖 Powered by Gemini
`;
}

// ========= 主逻辑 =========
async function listEmails() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
      q: "is:unread",
    });

    const messages = res.data.messages || [];

    if (messages.length === 0) {
      console.log("📭 No unread emails. Skipping report.");
      return;
    }

    let emailText = "";

    for (let msg of messages) {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = msgData.data.payload.headers;

      const subject =
        headers.find(h => h.name === "Subject")?.value || "No Subject";

      const from =
        headers.find(h => h.name === "From")?.value || "Unknown Sender";

      emailText += `From: ${from}\nSubject: ${subject}\n\n`;

      // 标记为已读
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    }

    const analysis = await analyzeEmails(emailText);

    const finalMessage = formatDailyReport(analysis);

    await sendTelegram(finalMessage);

    console.log("📤 AI report sent to Telegram.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ========= 每天早上 10 点 =========
cron.schedule(
  "0 10 * * *",
  async () => {
    console.log("⏰ Running daily AI mail brief...");
    await listEmails();
  },
  {
    timezone: "America/Chicago"
  }
);

// 启动时运行一次（可保留）
listEmails();