const { google } = require("googleapis");
const readline = require("readline");

// 从环境变量读取 OAuth 信息
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://mail.google.com/"
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // 强制刷新token
});

console.log("🔗 打开这个链接进行授权:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\n输入授权后得到的 code: ", async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("\n✅ 你的 refresh_token 是:\n");
    console.log(tokens.refresh_token);
  } catch (error) {
    console.error("❌ 获取 token 失败:", error);
  }
  rl.close();
});