import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Utility class for managing secure codes used for email verification
 * and password setup validation
 */
export class SecureCodeUtil {
  /**
   * Generates a random secure code
   * @param length - Length of the code (default: 6)
   * @returns Random numeric string
   */
  static generateCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Hashes a secure code using bcrypt
   * @param code - The code to hash
   * @returns Hashed code
   */
  static async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  /**
   * Verifies a secure code against its hash
   * @param code - The code to verify
   * @param hashedCode - The hashed code to compare against
   * @returns True if the code matches the hash
   */
  static async verifyCode(code: string, hashedCode: string): Promise<boolean> {
    return bcrypt.compare(code, hashedCode);
  }

  /**
   * Generates a secure token using crypto for additional security
   * @param length - Length of the token in bytes (default: 32)
   * @returns Random hex string
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Creates a time-limited secure code with expiration
   * @param codeLength - Length of the code (default: 6)
   * @param expirationMinutes - Expiration time in minutes (default: 15)
   * @returns Object containing the code and expiration timestamp
   */
  static createTimeLimitedCode(
    codeLength: number = 6,
    expirationMinutes: number = 15,
  ): { code: string; expiresAt: Date } {
    const code = this.generateCode(codeLength);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    return { code, expiresAt };
  }
}
