import { Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('MailProvider');

export interface MailProviderSendOptions {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface MailProviderSendResult {
  successLog: string;
}

export interface MailProviderConfig {
  apiKey: string;
  defaultFrom: string;
}

export class MailProvider {
  private config: MailProviderConfig;
  private initialized = false;

  constructor(config: MailProviderConfig) {
    this.config = config;
    if (config.apiKey) {
      sgMail.setApiKey(config.apiKey);
      this.initialized = true;
    } else {
      logger.warn('SENDGRID_API_KEY not set; mail sending will be no-op');
    }
  }

  /**
   * Reads logo file and converts to base64 (without data URI prefix).
   * Used for inline attachments (CID) in SendGrid emails.
   */
  private getLogoAsBase64(): string | null {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'email', 'logo.png');
      if (!fs.existsSync(logoPath)) {
        logger.warn(`Logo file not found at ${logoPath}`);
        return null;
      }
      const logoBuffer = fs.readFileSync(logoPath);
      // Return base64 WITHOUT data URI prefix (SendGrid requires raw base64)
      return logoBuffer.toString('base64');
    } catch (err) {
      logger.error('Error reading logo file:', err);
      return null;
    }
  }

  /**
   * Normalizes email address for SendGrid.
   * Accepts: "email@domain.com" or "Name <email@domain.com>"
   * Converts malformed formats like "Name email@domain.com" to "Name <email@domain.com>"
   */
  private normalizeFromEmail(email: string): string {
    email = email.trim();

    // Already in correct format: "Name <email@domain.com>"
    if (/^.+?\s*<.+?>$/.test(email)) {
      return email;
    }

    // Extract email from malformed format like "Projeto Basquete no-reply@domain.com"
    const emailMatch = email.match(/([^\s<>]+@[^\s<>]+\.[^\s<>]+)/);
    if (emailMatch) {
      const emailAddr = emailMatch[1];
      const namePart = email.replace(emailAddr, '').trim();

      if (namePart) {
        // Has name: format as "Name <email>"
        return `${namePart} <${emailAddr}>`;
      } else {
        // Just email
        return emailAddr;
      }
    }

    // Try to validate as plain email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return email;
    }

    throw new Error(
      `Invalid from email format: "${email}". Use "email@domain.com" or "Name <email@domain.com>"`,
    );
  }

  async send(
    options: MailProviderSendOptions,
  ): Promise<MailProviderSendResult> {
    const rawFrom = options.from ?? this.config.defaultFrom;
    if (!this.initialized) {
      logger.log(`[no-op] Would send to ${options.to}: ${options.subject}`);
      return {
        successLog: JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            note: 'Mail provider not initialized (no-op mode)',
          },
          null,
          2,
        ),
      };
    }

    // Validate required fields
    if (!rawFrom) {
      throw new Error('From email is required (set MAIL_DEFAULT_FROM env var)');
    }
    if (!options.to) {
      throw new Error('To email is required');
    }
    if (!options.subject) {
      throw new Error('Subject is required');
    }
    if (!options.html && !options.text) {
      throw new Error('Either html or text content is required');
    }

    // Normalize from email format
    const from = this.normalizeFromEmail(rawFrom);

    // Read logo and prepare inline attachment
    const logoBase64 = this.getLogoAsBase64();
    const attachments: Array<{
      content: string;
      filename: string;
      type: string;
      disposition: string;
      content_id: string;
    }> = [];

    if (logoBase64) {
      attachments.push({
        content: logoBase64,
        filename: 'logo.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'logo',
      });
    }

    // Build message object following SendGrid v3 API format
    // Format matches official SendGrid example: { to, from, subject, html, text, attachments }
    const msg: {
      to: string;
      from: string;
      subject: string;
      html?: string;
      text?: string;
      replyTo?: string;
      attachments?: Array<{
        content: string;
        filename: string;
        type: string;
        disposition: string;
        content_id: string;
      }>;
    } = {
      to: options.to,
      from,
      subject: options.subject,
    };

    if (options.html) {
      msg.html = options.html;
    }
    if (options.text) {
      msg.text = options.text;
    }
    if (options.replyTo) {
      msg.replyTo = options.replyTo;
    }
    if (attachments.length > 0) {
      msg.attachments = attachments;
    }

    try {
      logger.debug(`Sending email via SendGrid:`, {
        to: msg.to,
        from: msg.from,
        subject: msg.subject,
        hasHtml: !!msg.html,
        hasText: !!msg.text,
        normalizedFrom:
          from !== rawFrom ? `(normalized from: ${rawFrom})` : undefined,
      });

      const [response] = await sgMail.send(msg as any);
      logger.log(`Email sent successfully to ${options.to}`);

      // Build success log with SendGrid response details
      const successLog = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body,
        },
        null,
        2,
      );

      return { successLog };
    } catch (err: unknown) {
      // SendGrid errors have response.body with details
      if (err && typeof err === 'object' && 'response' in err) {
        const sgError = err as {
          response?: {
            body?: unknown;
            statusCode?: number;
            headers?: unknown;
          };
          message?: string;
        };
        const statusCode = sgError.response?.statusCode ?? 'unknown';
        const body = sgError.response?.body;

        logger.error(
          `SendGrid API error (${statusCode}): ${sgError.message ?? 'Unknown error'}`,
        );
        logger.error(`SendGrid response body:`, JSON.stringify(body, null, 2));

        // Extract error details if available
        if (body && typeof body === 'object' && 'errors' in body) {
          const errors = (body as { errors?: unknown[] }).errors;
          if (Array.isArray(errors)) {
            errors.forEach((error, idx) => {
              logger.error(
                `  Error ${idx + 1}:`,
                JSON.stringify(error, null, 2),
              );
            });
          }
        }
      } else {
        logger.error(
          `SendGrid error: ${err instanceof Error ? err.message : String(err)}`,
        );
        if (err instanceof Error && err.stack) {
          logger.error(`Stack trace:`, err.stack);
        }
      }

      // Create enhanced error with all details for job tracking
      const enhancedError = new Error(
        `SendGrid send failed: ${err instanceof Error ? err.message : String(err)}`,
      );

      // Preserve original error stack if available
      if (err instanceof Error && err.stack) {
        enhancedError.stack = err.stack;
      }

      // Attach response details to error for job worker to capture
      if (err && typeof err === 'object') {
        Object.assign(enhancedError, {
          originalError: err,
          response: (err as { response?: unknown }).response,
        });
      }

      throw enhancedError;
    }
  }
}
