import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { MailProvider } from './mail.provider';

export interface SendTemplateOptions {
  subject?: string;
  locale?: string;
  replyTo?: string;
  recipientName?: string;
}

/** Registry: template key -> { subject, path } */
const TEMPLATE_REGISTRY: Record<
  string,
  { subject: string; filename: string }
> = {
  WELCOME: {
    subject: 'Bem-vindo ao ARU CRM - Crie sua senha',
    filename: 'welcome.hbs',
  },
  RESET_PASSWORD: {
    subject: 'Recuperar senha - ARU CRM',
    filename: 'reset-password.hbs',
  },
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly templatesDir: string;
  private readonly assetsDir: string;

  constructor(
    private readonly mailProvider: MailProvider,
    private readonly config: ConfigService,
  ) {
    // Templates are copied to dist by nest-cli.json assets config
    // In dev: __dirname = src/modules/mail
    // In prod: __dirname = dist/modules/mail (templates copied to dist/modules/mail/templates)
    this.templatesDir = path.join(__dirname, 'templates');
    this.assetsDir = path.join(__dirname, 'assets');

    // Verify templates directory exists
    if (!fs.existsSync(this.templatesDir)) {
      this.logger.error(
        `Templates directory not found: ${this.templatesDir}. Make sure nest-cli.json is configured to copy .hbs files.`,
      );
    } else {
      this.logger.log(`Templates directory: ${this.templatesDir}`);
    }

    // Verify assets directory exists
    if (!fs.existsSync(this.assetsDir)) {
      this.logger.warn(
        `Assets directory not found: ${this.assetsDir}. Create it to store email assets (logos, images, etc.).`,
      );
    } else {
      this.logger.log(`Assets directory: ${this.assetsDir}`);
    }
  }

  /**
   * Sends an email using a template.
   * @param templateKey - Key from TEMPLATE_REGISTRY (e.g. 'WELCOME')
   * @param to - Recipient email
   * @param data - Data for template rendering
   * @param options - Optional subject, locale, recipientName, etc.
   */
  async sendTemplate(
    templateKey: string,
    to: string,
    data: Record<string, unknown>,
    options?: SendTemplateOptions,
  ): Promise<{ successLog: string }> {
    const meta = TEMPLATE_REGISTRY[templateKey];
    if (!meta) {
      throw new Error(`Unknown template key: ${templateKey}`);
    }

    // Try to find template file in multiple locations
    const possiblePaths = [
      path.join(this.templatesDir, meta.filename),
      path.join(process.cwd(), 'src', 'modules', 'mail', 'templates', meta.filename),
      path.join(process.cwd(), 'dist', 'modules', 'mail', 'templates', meta.filename),
    ];

    let templatePath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        templatePath = possiblePath;
        break;
      }
    }

    if (!templatePath) {
      this.logger.error(`Template file not found. Checked:`);
      possiblePaths.forEach((p) => this.logger.error(`  - ${p}`));
      throw new Error(
        `Template file not found: ${meta.filename}. Searched in: ${possiblePaths.join(', ')}`,
      );
    }

    const raw = fs.readFileSync(templatePath, 'utf-8');
    
    // Register Handlebars helpers for assets (only once)
    if (!Handlebars.helpers.assetBase64) {
      // Register helper to get asset as base64 (recommended for emails)
      Handlebars.registerHelper('assetBase64', (filename: string) => {
        try {
          return this.getAssetAsBase64(filename);
        } catch (err) {
          this.logger.error(`Error loading asset ${filename}:`, err);
          return '';
        }
      });
      
      // Register helper to get asset URL (if serving assets statically)
      Handlebars.registerHelper('assetUrl', (filename: string) => {
        return this.getAssetUrl(filename);
      });
    }
    
    const template = Handlebars.compile(raw);

    // Inject FRONTEND_URL into template data if not already present
    const templateData = {
      ...data,
      frontendUrl:
        data.frontendUrl ??
        this.config.get<string>('FRONTEND_URL', 'http://localhost:3001'),
    };

    const html = template(templateData);
    const subject = options?.subject ?? meta.subject;

    const result = await this.mailProvider.send({
      to,
      subject,
      html,
      replyTo: options?.replyTo,
    });

    this.logger.log(`Sent template ${templateKey} to ${to}`);
    return result;
  }

  /**
   * Converts an image file from assets directory to base64 data URL.
   * Useful for embedding images directly in email HTML (better email client compatibility).
   * @param filename - Name of the file in the assets directory (e.g., 'logo.png')
   * @param mimeType - MIME type (e.g., 'image/png', 'image/jpeg'). Auto-detected if not provided.
   * @returns Base64 data URL string (e.g., 'data:image/png;base64,...')
   */
  getAssetAsBase64(filename: string, mimeType?: string): string {
    const possiblePaths = [
      path.join(this.assetsDir, filename),
      path.join(process.cwd(), 'src', 'modules', 'mail', 'assets', filename),
      path.join(process.cwd(), 'dist', 'modules', 'mail', 'assets', filename),
    ];

    let assetPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        assetPath = possiblePath;
        break;
      }
    }

    if (!assetPath) {
      this.logger.error(`Asset file not found: ${filename}. Checked:`, possiblePaths);
      throw new Error(`Asset file not found: ${filename}`);
    }

    const fileBuffer = fs.readFileSync(assetPath);
    const base64 = fileBuffer.toString('base64');

    // Auto-detect MIME type from extension if not provided
    if (!mimeType) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
      };
      mimeType = mimeTypes[ext] || 'application/octet-stream';
    }

    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Gets the public URL for an asset (if assets are served statically).
   * Requires MAIL_ASSETS_BASE_URL to be configured.
   * @param filename - Name of the file in the assets directory
   * @returns Public URL string
   */
  getAssetUrl(filename: string): string {
    const baseUrl =
      this.config.get<string>('MAIL_ASSETS_BASE_URL') ||
      this.config.get<string>('BASE_URL') ||
      'http://localhost:3000';
    return `${baseUrl}/mail-assets/${filename}`;
  }

  /**
   * Sends a raw HTML email (no template).
   */
  async sendRaw(
    to: string,
    subject: string,
    html: string,
    options?: { replyTo?: string; text?: string },
  ): Promise<{ successLog: string }> {
    return await this.mailProvider.send({
      to,
      subject,
      html,
      text: options?.text,
      replyTo: options?.replyTo,
    });
  }
}
