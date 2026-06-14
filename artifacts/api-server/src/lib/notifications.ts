import { logger } from "./logger";

const ADMIN_EMAIL = "sakurateaches0701@gmail.com";

function gradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    "A+": "Outstanding",
    "A": "Excellent",
    "B": "Good",
    "C": "Average",
    "D": "Needs Practice",
  };
  return labels[grade] ?? grade;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export async function sendEmailNotification(result: {
  id: number;
  playerName?: string;
  quizType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  grade: string;
}): Promise<void> {
  const emailApiKey = process.env.RESEND_API_KEY;
  if (!emailApiKey) {
    logger.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const subject = `Kana Quiz Result: ${result.grade} (${Math.round(result.percentage)}%) — ${result.quizType}`;
  const body = `
Japanese Kana Quiz Result

Player: ${result.playerName ?? "Anonymous"}
Mode: ${result.quizType.charAt(0).toUpperCase() + result.quizType.slice(1)}
Score: ${result.score} / ${result.totalQuestions}
Accuracy: ${Math.round(result.percentage)}%
Grade: ${result.grade} — ${gradeLabel(result.grade)}
Time Taken: ${formatTime(result.timeTakenSeconds)}
Result ID: #${result.id}

View full results in the admin dashboard.
  `.trim();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kana Quiz <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text }, "Failed to send email");
    } else {
      logger.info({ to: ADMIN_EMAIL }, "Email notification sent");
    }
  } catch (err) {
    logger.error({ err }, "Error sending email notification");
  }
}

export async function sendDiscordNotification(result: {
  id: number;
  playerName?: string;
  quizType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  grade: string;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("DISCORD_WEBHOOK_URL not set — skipping Discord notification");
    return;
  }

  const percentage = Math.round(result.percentage);
  const color =
    percentage >= 90 ? 0x00ff88 :
    percentage >= 70 ? 0x7c3aed :
    percentage >= 50 ? 0xfbbf24 :
    0xef4444;

  const payload = {
    embeds: [
      {
        title: `Kana Quiz Completed — ${result.grade}`,
        color,
        fields: [
          { name: "Player", value: result.playerName ?? "Anonymous", inline: true },
          { name: "Mode", value: result.quizType.charAt(0).toUpperCase() + result.quizType.slice(1), inline: true },
          { name: "Score", value: `${result.score} / ${result.totalQuestions}`, inline: true },
          { name: "Accuracy", value: `${percentage}%`, inline: true },
          { name: "Grade", value: `${result.grade} — ${gradeLabel(result.grade)}`, inline: true },
          { name: "Time", value: formatTime(result.timeTakenSeconds), inline: true },
          { name: "Result ID", value: `#${result.id}`, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Japanese Kana Quiz" },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text }, "Failed to send Discord notification");
    } else {
      logger.info("Discord notification sent");
    }
  } catch (err) {
    logger.error({ err }, "Error sending Discord notification");
  }
}
