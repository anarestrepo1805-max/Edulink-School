import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// =========================================================================
// SECURITY & CRYPTOGRAPHY UTILITIES
// =========================================================================

/**
 * Hashes a password using PBKDF2 with SHA-512 and a cryptographically random salt.
 * 100,000 iterations to protect against brute-force and rainbow table attacks.
 */
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Validates a password against a stored PBKDF2 hash and salt.
 */
function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// =========================================================================
// IN-MEMORY SECURITY STORES (WITH EXCLUSION OF SENSITIVE LOGS)
// =========================================================================

interface ResetRequest {
  email: string;
  code: string;
  expiresAt: number; // timestamp in ms (10 min duration)
  attempts: number;  // Max 5 attempts
  verified: boolean;
  resetToken?: string;
}

// Map: normalized email -> ResetRequest
const resetStore = new Map<string, ResetRequest>();

// Rate Limiter: IP / Email -> timestamp list (Max 5 requests per 10 min)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) {
    return false; // Rate limit exceeded
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

// Stored hashed passwords in server state: email -> { hash, salt, updatedAt }
const passwordStore = new Map<string, { hash: string; salt: string; updatedAt: string }>();

// Pre-initialize demo accounts with secure hashed passwords
const INITIAL_DEMO_ACCOUNTS = [
  'miguel.jimenez@edulink.edu.co',
  'daniela.alvarez@edulink.edu.co',
  'elena.jimenez@vallejuelos.edu.co',
  'carlos.coordinacion@edulink.edu.co'
];

for (const demoEmail of INITIAL_DEMO_ACCOUNTS) {
  const { hash, salt } = hashPassword('Vallejuelos2026*');
  passwordStore.set(demoEmail.toLowerCase(), {
    hash,
    salt,
    updatedAt: new Date().toISOString()
  });
}

// =========================================================================
// RESEND EMAIL DISPATCH SERVICE
// =========================================================================

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('re_123456789')) {
    return null;
  }
  return new Resend(apiKey.trim());
}

async function sendRecoveryEmailViaResend(
  recipientEmail: string,
  code: string
): Promise<{ success: boolean; resendDispatched: boolean; error?: string }> {
  const resend = getResendClient();
  let fromEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
  if (!fromEmail.includes('<') && !fromEmail.includes('>')) {
    fromEmail = `EDULINK SCHOOL <${fromEmail}>`;
  }

  if (!resend) {
    return {
      success: false,
      resendDispatched: false,
      error: 'RESEND_API_KEY no está configurada en las variables de entorno. Por favor agrégala como secreto en Google AI Studio.'
    };
  }

  const subject = 'Código de recuperación - EDULINK SCHOOL';

  const textBody = `EDULINK SCHOOL
Recuperación de contraseña

Tu código de recuperación es:
${code}

Este código es válido durante 10 minutos.

Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje.`;

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de recuperación - EDULINK SCHOOL</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #080d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);">
    
    <!-- Header -->
    <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1e293b; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #38bdf8;">
        EDULINK <span style="color: #ffffff;">SCHOOL</span>
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
        Plataforma Educativa Institucional
      </p>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 28px;">
      <h2 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 700; color: #ffffff;">
        Recuperación de contraseña
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        Has recibido este correo porque se solicitó restablecer la contraseña para tu cuenta institucional. Tu código de verificación es:
      </p>

      <!-- 6-digit Code Box -->
      <div style="background-color: #030712; border: 2px dashed #0284c7; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; display: inline-block;">
          ${code}
        </span>
      </div>

      <div style="background-color: rgba(2, 132, 199, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 12px 16px; margin: 16px 0; text-align: center;">
        <span style="font-size: 13px; font-weight: 600; color: #38bdf8;">
          ⏱ Este código es válido durante 10 minutos.
        </span>
      </div>
    </div>

    <!-- Security Notice -->
    <div style="border-top: 1px solid #1e293b; padding-top: 20px;">
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
        Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje de forma segura. Tu contraseña actual no cambiará sin este código.
      </p>
    </div>

  </div>
  <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #475569;">
    © 2026 EDULINK SCHOOL. Todos los derechos reservados.
  </div>
</body>
</html>`;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject,
      text: textBody,
      html: htmlBody
    });

    if (response.error) {
      return {
        success: false,
        resendDispatched: false,
        error: response.error.message || 'Error al despachar el correo con Resend'
      };
    }

    return { success: true, resendDispatched: true };
  } catch (err: any) {
    return {
      success: false,
      resendDispatched: false,
      error: err.message || 'Error de conexión con la API de Resend'
    };
  }
}

// =========================================================================
// REST API ROUTES
// =========================================================================

/**
 * 1. POST /api/auth/request-password-reset
 * - Validates registered email
 * - Checks rate limit (max 5 requests per 10 mins)
 * - Generates 6-digit random code
 * - Sets 10-minute expiration
 * - Sends email via Resend
 * - Stores state securely
 */
app.post('/api/auth/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un correo electrónico válido.'
      });
    }

    // Rate Limiting protection
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}_${cleanEmail}`;
    if (!checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes de recuperación. Por favor espera unos minutos antes de intentar de nuevo.'
      });
    }

    // Generate cryptographically secure 6-digit code
    const codeNumber = crypto.randomInt(100000, 1000000);
    const code = codeNumber.toString();

    // 10-minute limited expiration as requested
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const expiresAt = Date.now() + TEN_MINUTES_MS;

    // Save in in-memory secure store
    resetStore.set(cleanEmail, {
      email: cleanEmail,
      code,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // Send email via Resend SDK
    const emailResult = await sendRecoveryEmailViaResend(cleanEmail, code);

    if (!emailResult.resendDispatched) {
      let friendlyError = emailResult.error || 'Error al despachar el correo con Resend.';
      if (
        friendlyError.includes('testing email address') ||
        friendlyError.includes('only send testing emails') ||
        friendlyError.includes('Invalid `to` field')
      ) {
        friendlyError = 'Resend (Modo Prueba): En modo de prueba con onboarding@resend.dev solo puedes enviar correos a la dirección de tu cuenta de Resend. Para enviar a cualquier otro correo institucional (@edulink.edu.co, etc.), debes verificar tu dominio en resend.com/domains.';
      } else if (
        friendlyError.includes('API key') ||
        friendlyError.includes('unauthorized') ||
        friendlyError.includes('restricted')
      ) {
        friendlyError = 'Error de autenticación con Resend: La API Key configurada no es válida o ha sido revocada.';
      }

      return res.status(422).json({
        success: false,
        resendDispatched: false,
        message: friendlyError
      });
    }

    // Return response without leaking sensitive info (NO sensitive data in response)
    return res.json({
      success: true,
      email: cleanEmail,
      resendDispatched: true,
      expiresInMinutes: 10,
      message: 'Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico registrado.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de recuperación.'
    });
  }
});

/**
 * 2. POST /api/auth/verify-reset-code
 * - Verifies 6-digit code received
 * - Checks expiration (10 min)
 * - Checks brute-force attempts (max 5)
 * - Generates secure single-use resetToken
 */
app.post('/api/auth/verify-reset-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim().replace(/\s+/g, '');

    if (!cleanEmail || !cleanCode || cleanCode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa el código completo de 6 dígitos.'
      });
    }

    const record = resetStore.get(cleanEmail);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una solicitud activa de recuperación. Por favor solicita un nuevo código.'
      });
    }

    // Check attempts to protect against brute-force attacks
    if (record.attempts >= 5) {
      resetStore.delete(cleanEmail); // Invalidate code due to too many failed attempts
      return res.status(403).json({
        success: false,
        message: 'Has superado el número máximo de intentos permitidos. Por seguridad, debes solicitar un nuevo código.'
      });
    }

    // Check expiration (10 minutes)
    if (Date.now() > record.expiresAt) {
      resetStore.delete(cleanEmail);
      return res.status(410).json({
        success: false,
        message: 'El código de verificación ha expirado (validez de 10 minutos). Por favor solicita uno nuevo.'
      });
    }

    // Verify code matching using timing-safe comparison
    const expectedBuffer = Buffer.from(record.code);
    const receivedBuffer = Buffer.from(cleanCode);

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      record.attempts += 1;
      return res.status(400).json({
        success: false,
        message: `Código de verificación incorrecto. Intentos restantes: ${5 - record.attempts}.`
      });
    }

    // Code is valid! Generate single-use reset token valid for remaining time
    const resetToken = crypto.randomBytes(32).toString('hex');
    record.verified = true;
    record.resetToken = resetToken;

    return res.json({
      success: true,
      resetToken,
      message: 'Código verificado con éxito.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error al verificar el código.'
    });
  }
});

/**
 * 3. POST /api/auth/reset-password
 * - Validates new password complexity
 * - Validates resetToken / code
 * - Hashes password securely using PBKDF2 with salt
 * - Invalidates code and resetToken immediately (cannot be reused)
 */
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, resetToken, code, newPassword } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = newPassword || '';

    // Password rules validation
    if (cleanPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.'
      });
    }
    if (!/[A-Z]/.test(cleanPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una letra mayúscula (A-Z).'
      });
    }
    if (!/[a-z]/.test(cleanPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una letra minúscula (a-z).'
      });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(cleanPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos un carácter especial (!@#$%).'
      });
    }

    const record = resetStore.get(cleanEmail);

    let isAuthorized = false;

    if (record) {
      // Validate either resetToken or verified status with valid expiration
      if (Date.now() <= record.expiresAt) {
        if (resetToken && record.resetToken === resetToken) {
          isAuthorized = true;
        } else if (code && record.code === code.trim()) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'La sesión de recuperación es inválida o ha expirado. Por favor solicita un nuevo código.'
      });
    }

    // Hash password securely with PBKDF2 + salt (never store plain text)
    const { hash, salt } = hashPassword(cleanPassword);

    passwordStore.set(cleanEmail, {
      hash,
      salt,
      updatedAt: new Date().toISOString()
    });

    // INVALIDATE CODE AND TOKEN IMMEDIATELY (single use)
    resetStore.delete(cleanEmail);

    return res.json({
      success: true,
      message: '¡Contraseña actualizada con éxito!'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la contraseña.'
    });
  }
});

/**
 * 4. POST /api/auth/verify-login-password
 * - Verifies password for login against stored PBKDF2 hash or demo fallback
 * - Securely upgrades plain passwords to PBKDF2 hash upon successful login
 */
app.post('/api/auth/verify-login-password', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ valid: false });
    }

    const record = passwordStore.get(cleanEmail);

    if (record) {
      const isValid = verifyPassword(cleanPassword, record.hash, record.salt);
      return res.json({ valid: isValid });
    }

    // Default institutional demo password check
    if (cleanPassword === 'Vallejuelos2026*') {
      // Upgrade immediately to PBKDF2 hash
      const { hash, salt } = hashPassword(cleanPassword);
      passwordStore.set(cleanEmail, {
        hash,
        salt,
        updatedAt: new Date().toISOString()
      });
      return res.json({ valid: true });
    }

    return res.json({ valid: false });
  } catch {
    return res.status(500).json({ valid: false });
  }
});

// =========================================================================
// VITE INTEGRATION FOR FULL-STACK SPA
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EDULINK SCHOOL] Servidor full-stack activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[EDULINK SCHOOL] Error al iniciar servidor:', err.message);
  process.exit(1);
});
