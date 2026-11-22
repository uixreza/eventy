import { toJalaali } from "jalaali-js";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * The row behind the settings form, shaped the way the form speaks.
 * `birthDate` is stored Gregorian (`@db.Date`, UTC midnight) and handed
 * over as Jalali y/m/d — what the three Shamsi selects speak.
 */
export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, nationalId: true, birthDate: true },
  });
  /* A session without a row is not a signed-in user anymore. */
  if (!profile) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const birth = toJalaali(
    profile.birthDate.getUTCFullYear(),
    profile.birthDate.getUTCMonth() + 1,
    profile.birthDate.getUTCDate(),
  );

  return NextResponse.json({
    fullName: profile.name,
    phone: profile.phone,
    nationalId: profile.nationalId,
    birth: { year: birth.jy, month: birth.jm, day: birth.jd },
  });
}
