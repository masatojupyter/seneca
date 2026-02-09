import nodemailer from 'nodemailer';
import type { EmailGateway, SendEmailInput, SendEmailResult } from '@/lib/server/gateway/email-gateway';

/**
 * Nodemailer設定の型
 */
type NodemailerConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
};

/**
 * 環境変数からNodemailer設定を取得
 */
function getNodemailerConfig(): NodemailerConfig {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      'SMTP設定が不完全です。環境変数 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM を設定してください。'
    );
  }

  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber)) {
    throw new Error('SMTP_PORTは数値である必要があります。');
  }

  return {
    host,
    port: portNumber,
    secure: portNumber === 465,
    auth: {
      user,
      pass,
    },
    from,
  };
}

/**
 * Nodemailerトランスポートのシングルトン
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = getNodemailerConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }
  return transporter;
}

/**
 * Nodemailerを使用したEmailGateway実装
 */
export const nodemailerGateway: EmailGateway = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const config = getNodemailerConfig();
      const transport = getTransporter();

      const info = await transport.sendMail({
        from: config.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('メール送信エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'メール送信に失敗しました',
      };
    }
  },
};

/**
 * 開発環境用のコンソール出力EmailGateway
 */
export const consoleEmailGateway: EmailGateway = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    console.log('\n========================================');
    console.log('📧 メール送信（開発環境 - コンソール出力）');
    console.log('========================================');
    console.log('To:', input.to);
    console.log('Subject:', input.subject);
    console.log('----------------------------------------');
    console.log('Text Content:');
    console.log(input.text || '(なし)');
    console.log('========================================\n');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  },
};

/**
 * 環境に応じたEmailGatewayを取得
 * 本番環境: nodemailerGateway
 * 開発環境: SMTP設定があればnodemailer、なければconsoleGateway
 */
export function getEmailGateway(): EmailGateway {
  // 本番環境は常にnodemailer
  if (process.env.NODE_ENV === 'production') {
    return nodemailerGateway;
  }

  // 開発環境でSMTP設定がある場合はnodemailer
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM;

  if (hasSmtpConfig) {
    return nodemailerGateway;
  }

  // それ以外はコンソール出力
  return consoleEmailGateway;
}
