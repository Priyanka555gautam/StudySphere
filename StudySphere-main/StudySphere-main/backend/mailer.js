// Zero-dependency SMTP client — sends real email through a normal mailbox
// (Gmail, Outlook, Zoho, a company mail server, etc.) using only Node's
// built-in `node:tls` module. No `nodemailer` / SDK dependency, matching
// the rest of this backend.
//
// WHY THIS EXISTS INSTEAD OF A TRANSACTIONAL-EMAIL API (e.g. Resend):
// Services like Resend only let their shared sandbox sender
// ("onboarding@resend.dev") deliver mail to the *account owner's own*
// address until a custom domain is verified — every other recipient
// silently gets nothing. A normal SMTP mailbox has no such restriction:
// once you're authenticated, you can send to any recipient, which is
// what a real "forgot password" flow needs.
//
// Configure via SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
// in backend/.env — see .env.example for a Gmail walkthrough.

const tls = require("node:tls");
const crypto = require("node:crypto");

/** Reads one full SMTP response (possibly multi-line, e.g. "250-a\r\n250 b\r\n")
 *  off the socket and resolves once the terminating line (SPACE, not DASH,
 *  after the 3-digit code) arrives. */
function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\r\n").filter(Boolean);
      const last = lines[lines.length - 1] || "";
      if (/^\d{3} /.test(last)) {
        cleanup();
        resolve({ code: Number(last.slice(0, 3)), text: buffer });
      }
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    function cleanup() {
      socket.removeListener("data", onData);
      socket.removeListener("error", onError);
    }

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

/** Writes one command (CRLF-terminated) and waits for the response,
 *  throwing if the response code isn't one of `expectedCodes`. Pass
 *  `command = null` to just wait for a response (e.g. the initial
 *  server greeting, which arrives without us sending anything first). */
async function sendCommand(socket, command, expectedCodes) {
  const responsePromise = readResponse(socket);
  if (command !== null) socket.write(`${command}\r\n`);
  const { code, text } = await responsePromise;
  if (expectedCodes && !expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed (${code}): ${text.trim()}`);
  }
  return text;
}

function encodeHeader(value) {
  return String(value).replace(/\r|\n/g, " ");
}

function extractEmail(addr) {
  const match = String(addr).match(/<([^>]+)>/);
  return (match ? match[1] : addr).trim();
}

/** RFC 5321 "dot-stuffing": any line in the message body that starts
 *  with a literal "." must get an extra "." prepended, since a lone
 *  "." on its own line is how DATA is terminated. Also normalizes all
 *  line endings to CRLF, which SMTP requires. */
function buildMessage({ from, to, subject, html }) {
  const headers = [
    `From: ${encodeHeader(from)}`,
    `To: ${encodeHeader(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@studysphere.local>`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
  ].join("\r\n");

  const normalizedBody = String(html).replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
  const dotStuffed = normalizedBody
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");

  return `${headers}\r\n\r\n${dotStuffed}\r\n.`;
}

/** Sends one HTML email via implicit-TLS SMTP (port 465) with AUTH LOGIN.
 *  Throws on any failure — caller decides how to handle/log it. */
async function sendMail({ host, port, user, pass, from, to, subject, html }) {
  const socket = tls.connect({ host, port: port || 465, servername: host });

  await new Promise((resolve, reject) => {
    socket.once("secureConnect", resolve);
    socket.once("error", reject);
  });

  try {
    await sendCommand(socket, null, [220]); // server greeting
    await sendCommand(socket, `EHLO ${host}`, [250]);
    await sendCommand(socket, "AUTH LOGIN", [334]);
    await sendCommand(socket, Buffer.from(user, "utf8").toString("base64"), [334]);
    await sendCommand(socket, Buffer.from(pass, "utf8").toString("base64"), [235]);

    const fromEmail = extractEmail(from);
    const toEmail = extractEmail(to);

    await sendCommand(socket, `MAIL FROM:<${fromEmail}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${toEmail}>`, [250, 251]);
    await sendCommand(socket, "DATA", [354]);
    await sendCommand(socket, buildMessage({ from, to, subject, html }), [250]);

    await sendCommand(socket, "QUIT", [221]).catch(() => {}); // best-effort
  } finally {
    socket.end();
  }
}

module.exports = { sendMail };
