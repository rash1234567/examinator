import { Request, Response } from "express";
import {
  createUser,
  // deleteAllUsers
} from "../services/user.service";
import prisma from "../prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/email.services";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "../utils/passwordReset";
import { normalizeEmail, normalizeMatric } from "../utils/studentIdentity";
import { resolveUserByEmail } from "../utils/resolveUser";

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const FORGOT_PASSWORD_MESSAGE =
  "If an account exists with that email, we sent password reset instructions.";

export async function registerAccountForExaminer(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, school, country, department, faculty } = req.body;
    const user = await createUser({
      firstName,
      lastName,
      email,
      password,
      role: "EXAMINER",
      school,
      country,
      department,
      faculty
    });
    const token = jwt.sign(
      { userId: user.id, userRole: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );
    if (user) {
      const link = `http://localhost:8989/api/auth/verify-email?token=${token}`;
      await sendVerificationEmail(email, `${firstName} ${lastName}`, link);
    }
    res.status(201).json({
      message: "Account created successfully check your email for verification",
    });
  } catch (error: any) {
    console.log(error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // 1. Verify token
    const decodedToken = jwt.verify(
      token as string,
      process.env.JWT_SECRET as string
    );

    const userId = (decodedToken as any).userId;

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Already verified check
    if (user.emailVerified) {
      return res.status(200).json({
        message: "Email already verified. Please login.",
      });
    }

    // 4. Verify email
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    return res.status(200).json({
      message: "Email verified successfully 🎉",
    });

  } catch (error: any) {
    console.log(error);

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Verification link expired. Please request a new one.",
      });
    }

    // Invalid token OR reused tampered token
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        message: "Invalid verification link",
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function resendVerificationEmail(req: Request, res: Response) {
  try {
    const { email, school } = req.body;
    const { user, ambiguous } = await resolveUserByEmail(email, school);

    if (ambiguous) {
      return res.status(400).json({
        message:
          "Multiple accounts use this email. Include your school name in the request body.",
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // 2. Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: "Email already verified please login to your account",
      });
    }
    // 3. Generate new token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );
    // 4. Create link
    const link = `http://localhost:8989/api/auth/verify-email?token=${token}`;
    // 5. Send email again
    await sendVerificationEmail(
      user.email!,
      `${user.firstName} ${user.lastName}`,
      link,
    );

    res.status(200).json({
      message: "Verification email resent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

/**
 * Deletes every user row. Protected by RESET_USERS_SECRET in .env.
 * POST body: { "secret": "<same as env>" } OR header: x-reset-secret
 */
// export async function resetAllUsers(req: Request, res: Response) {
//   try {
//     const expected = process.env.RESET_USERS_SECRET;
//     if (!expected) {
//       return res.status(503).json({
//         message:
//           "RESET_USERS_SECRET is not set. Add it to .env to enable this endpoint.",
//       });
//     }

//     const provided =
//       (typeof req.body?.secret === "string" ? req.body.secret : undefined) ||
//       req.header("x-reset-secret");

//     if (provided !== expected) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     const { count } = await deleteAllUsers();
//     return res.status(200).json({
//       message: "All users deleted",
//       deletedCount: count,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// }

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email, school } = req.body;

    const { user, ambiguous } = await resolveUserByEmail(email, school);
    if (ambiguous) {
      return res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
    }

    if (
      user?.email &&
      user.provider === "LOCAL" &&
      user.password
    ) {
      const rawToken = generatePasswordResetToken();
      const hashedToken = hashPasswordResetToken(rawToken);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: new Date(
            Date.now() + PASSWORD_RESET_EXPIRY_MS,
          ),
        },
      });

      const frontendUrl =
        process.env.FRONTEND_URL ?? "http://localhost:3000";
      const link = `${frontendUrl}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        link,
      );
    }

    res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    const hashedToken = hashPasswordResetToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired reset link. Please request a new one.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        isFirstLogin: false,
      },
    });

    res.status(200).json({
      message:
        "Password updated successfully. You can log in with your new password.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { school, email, matricNumber, password } = req.body;

    let user = null;

    if (email) {
      const normalized = normalizeEmail(email);
      if (school) {
        user = await prisma.user.findUnique({
          where: {
            school_email: { school: school.trim(), email: normalized },
          },
        });
      } else {
        const matches = await prisma.user.findMany({
          where: { email: normalized },
        });
        if (matches.length === 1) {
          user = matches[0];
        } else if (matches.length > 1) {
          return res.status(400).json({
            message:
              "Multiple accounts use this email. Include your school in the login body.",
          });
        }
      }
    } else {
      if (!school) {
        return res.status(400).json({
          message: "School is required when logging in with matric number",
        });
      }
      const schoolKey = (school as string).trim();
      user = await prisma.user.findUnique({
        where: {
          school_matricNumber: {
            school: schoolKey,
            matricNumber: normalizeMatric(matricNumber),
          },
        },
      });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    if (!user.emailVerified) {
      return res.status(401).json({
        message: "Email not verified please check your email for verification",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password as string,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign(
      { userId: user.id, userRole: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );
    const refreshToken = jwt.sign(
      { userId: user.id, userRole: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );
    const { password: _, ...safeUser } = user;
    res
      .status(200)
      .json({ accessToken: token, refreshToken: refreshToken, user: safeUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
