/**
 * Notification service — kirim peringatan stok menipis via Email & WhatsApp (Fonnte).
 *
 * Konfigurasi lewat environment variables (semua opsional):
 *
 *   Email (Nodemailer SMTP):
 *     SMTP_HOST       mis. smtp.gmail.com
 *     SMTP_PORT       mis. 587 (default)
 *     SMTP_USER       alamat email pengirim
 *     SMTP_PASS       password / App Password Gmail
 *     NOTIFY_EMAIL_FROM  (opsional, default = SMTP_USER)
 *     NOTIFY_EMAIL_TO    alamat email tujuan (bisa dipisah koma)
 *
 *   WhatsApp via Fonnte (https://fonnte.com):
 *     FONNTE_TOKEN    API token dari dashboard Fonnte
 *     NOTIFY_WA_TO   nomor WA tujuan, format 628xxx (bisa dipisah koma)
 *
 * Jika env var tidak diisi, saluran tersebut dilewati tanpa error.
 */

import nodemailer from "nodemailer";

export interface LowStockAlert {
  itemName: string;
  barcode: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildMessage(a: LowStockAlert): string {
  return (
    `⚠️ PERINGATAN STOK MENIPIS\n\n` +
    `Barang  : ${a.itemName} (${a.barcode})\n` +
    `Sisa    : ${a.currentStock} ${a.unit}\n` +
    `Minimum : ${a.minStock} ${a.unit}\n\n` +
    `Segera lakukan pengadaan stok!`
  );
}

// ─── WhatsApp via Fonnte ───────────────────────────────────────────────────────

async function sendWhatsApp(a: LowStockAlert): Promise<void> {
  const token  = process.env.FONNTE_TOKEN;
  const target = process.env.NOTIFY_WA_TO;
  if (!token || !target) return;

  const message = buildMessage(a);

  // Kirim ke setiap nomor yang dipisah koma
  const numbers = target.split(",").map((n) => n.trim()).filter(Boolean);

  await Promise.all(
    numbers.map(async (number) => {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ target: number, message }),
      });
      if (!res.ok) {
        console.error(`[notify] Fonnte error (${number}):`, await res.text());
      } else {
        console.info(`[notify] WhatsApp terkirim ke ${number}: ${a.itemName}`);
      }
    }),
  );
}

// ─── Email via SMTP ────────────────────────────────────────────────────────────

async function sendEmail(a: LowStockAlert): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.NOTIFY_EMAIL_FROM ?? user;
  const to   = process.env.NOTIFY_EMAIL_TO;

  if (!host || !user || !pass || !to) return;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: `⚠️ Stok Menipis: ${a.itemName} (${a.currentStock} ${a.unit} tersisa)`,
    text: buildMessage(a),
    html: buildMessage(a).replace(/\n/g, "<br>"),
  });

  console.info(`[notify] Email terkirim ke ${to}: ${a.itemName}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: kirim semua saluran notifikasi yang dikonfigurasi.
 * Tidak pernah melempar error ke caller.
 */
export function notifyLowStock(alert: LowStockAlert): void {
  Promise.allSettled([
    sendWhatsApp(alert).catch((e) => console.error("[notify] WA error:", e)),
    sendEmail(alert).catch((e) => console.error("[notify] Email error:", e)),
  ]);
}
