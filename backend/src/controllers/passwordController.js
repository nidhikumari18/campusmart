
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const genericMessage =
  "If an account exists for this email, a reset link will be sent shortly.";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetLink =
      `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: user.email,
        subject: "Reset your CampusMart password",
        text:
          `Hello ${user.name},\n\n` +
          `Use this link to reset your password:\n` +
          `${resetLink}\n\n` +
          `This link expires in 15 minutes.\n` +
          `If you didn't request this, ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;
                      max-width:520px;margin:auto;padding:28px">
            <h2 style="color:#7650b8">CampusMart</h2>
            <h3>Reset your password</h3>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>We received a request to reset your password.</p>
            <p>
              <a href="${resetLink}"
                 style="display:inline-block;padding:14px 24px;
                        background:#7650b8;color:white;
                        border-radius:10px;text-decoration:none">
                Reset password
              </a>
            </p>
            <p>This link expires in 15 minutes.</p>
            <p>If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error("Reset email error:", mailError);

      return res.status(503).json({
        message: "Email service unavailable. Try again later.",
      });
    }

    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: "Password must be 8–128 characters.",
      });
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Invalid or expired reset link.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select(
      "+password +resetPasswordToken +resetPasswordExpires"
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.json({
      message: "Password updated. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
