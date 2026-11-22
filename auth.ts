import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isValidBirthDate,
  isValidNationalId,
  normalizeDigits,
  normalizeName,
  isValidName,
} from "@/lib/auth-flow";

/**
 * NextAuth (Auth.js v5) config.
 *
 * There is no password: the only credential is a one-time code sent to the
 * phone number. The code is checked by the `verifyOtp` server action, which
 * stamps it; `authorize` then requires that stamp before it will mint a
 * session, and consumes the code so it can never be replayed.
 */

type Profile = { name: string; nationalId: string; birthDate: Date };

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Server-side re-validation of everything step three collected. */
function readProfile(credentials: Record<string, unknown> | undefined): Profile | null {
  const name = normalizeName(asString(credentials?.name));
  const nationalId = normalizeDigits(asString(credentials?.nationalId));
  const birthDate = asString(credentials?.birthDate);

  if (!isValidName(name) || !isValidNationalId(nationalId) || !isValidBirthDate(birthDate)) {
    return null;
  }

  return { name, nationalId, birthDate: new Date(`${birthDate}T00:00:00.000Z`) };
}

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    phone: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  /* There is no dedicated login page — the flow lives in the modal on `/`. */
  pages: { signIn: "/" },
  providers: [
    Credentials({
      credentials: {
        phone: { label: "شماره موبایل", type: "tel" },
        mode: { label: "نحوه ورود", type: "text" },
        name: { label: "نام و نام خانوادگی", type: "text" },
        nationalId: { label: "کد ملی", type: "text" },
        birthDate: { label: "تاریخ تولد", type: "date" },
      },
      authorize: async (credentials) => {
        const phone = normalizeDigits(asString(credentials?.phone));
        if (!/^09\d{9}$/.test(phone)) return null;

        /* Only a code this phone number already proved it owns may open a
           session, and only until it expires. */
        const otp = await prisma.otpCode.findFirst({
          where: {
            phone,
            verifiedAt: { not: null },
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (!otp) return null;

        let user = await prisma.user.findUnique({ where: { phone } });

        if (credentials?.mode === "signup") {
          const profile = readProfile(credentials as Record<string, unknown>);
          if (!profile) return null;

          if (!user) {
            try {
              user = await prisma.user.create({ data: { phone, ...profile } });
            } catch {
              /* Two tabs finished signup at once — the winner's row is the
                 account, so fall back to reading it. */
              user = await prisma.user.findUnique({ where: { phone } });
            }
          }
        } else if (!user) {
          /* Login path: the account has to exist already. */
          return null;
        }
        if (!user) return null;

        /* An admin ban outranks a perfectly valid code: no session is ever
           minted for a blocked account. */
        if (user.bannedAt) return null;

        await prisma.otpCode.update({
          where: { id: otp.id },
          data: { consumedAt: new Date() },
        });

        return { id: user.id, name: user.name, phone: user.phone, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.name = token.name ?? null;
      return session;
    },
  },
});
