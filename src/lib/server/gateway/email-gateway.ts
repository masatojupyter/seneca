/**
 * メール送信のゲートウェイインターフェース
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export type EmailGateway = {
  sendEmail: (input: SendEmailInput) => Promise<SendEmailResult>;
};

/**
 * 管理者確認メール用の入力型
 */
export type SendAdminVerificationEmailInput = {
  to: string;
  name: string;
  verificationToken: string;
  baseUrl: string;
};

/**
 * 管理者確認メールを送信
 */
export async function sendAdminVerificationEmail(
  gateway: EmailGateway,
  input: SendAdminVerificationEmailInput
): Promise<SendEmailResult> {
  const { to, name, verificationToken, baseUrl } = input;
  const verificationUrl = `${baseUrl}/admin/verify-email?token=${verificationToken}`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>メールアドレスの確認 - Seneca</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Seneca>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 20px; font-weight: 600;">
                メールアドレスの確認
              </h2>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                ${name} 様
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Seneca録ありがとうございます。<br>
                以下のボタンをクリックして、メールアドレスの確認を完了してください。
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationUrl}"
                       style="display: inline-block; padding: 16px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      メールアドレスを確認する
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                ボタンがクリックできない場合は、以下のURLをブラウザにコピー&ペーストしてください：
              </p>
              <p style="margin: 0 0 20px; color: #4f46e5; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>

              <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>注意:</strong> このリンクは30分間有効です。<br>
                  有効期限が切れた場合は、再度登録を行ってください。
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                このメールは Senecaムから自動送信されています。<br>
                心当たりがない場合は、このメールを無視してください。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Senecaールアドレスの確認

${name} 様

Seneca録ありがとうございます。
以下のURLにアクセスして、メールアドレスの確認を完了してください。

${verificationUrl}

注意: このリンクは30分間有効です。
有効期限が切れた場合は、再度登録を行ってください。

--
このメールは Senecaムから自動送信されています。
心当たりがない場合は、このメールを無視してください。
`;

  return gateway.sendEmail({
    to,
    subject: '【Senecaアドレスの確認',
    html,
    text,
  });
}
