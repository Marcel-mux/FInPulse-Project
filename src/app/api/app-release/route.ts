import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/app-release
 * Mengambil informasi rilis terbaru dan status apakah user perlu melihat changelog modal
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil rilis paling baru
    const latestRelease = await prisma.appRelease.findFirst({
      orderBy: {
        releasedAt: "desc",
      },
    });

    if (!latestRelease) {
      return NextResponse.json({
        release: null,
        shouldShow: false,
        lastSeenVersion: "",
      });
    }

    // Ambil status lastSeenVersion user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenVersion: true },
    });

    const userLastSeen = user?.lastSeenVersion || "";
    const shouldShow = userLastSeen !== latestRelease.version;

    return NextResponse.json({
      release: latestRelease,
      shouldShow,
      lastSeenVersion: userLastSeen,
    });
  } catch (error: unknown) {
    console.error("[API_APP_RELEASE_GET_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/app-release
 * Menyimpan konfirmasi bahwa user telah membaca/menutup modal rilis versi tertentu
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const version = body?.version?.trim();

    if (!version) {
      return NextResponse.json(
        { error: "Bad Request", message: "Field 'version' wajib diisi" },
        { status: 400 }
      );
    }

    // Update lastSeenVersion pengguna
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSeenVersion: version,
      },
    });

    return NextResponse.json({
      success: true,
      lastSeenVersion: version,
    });
  } catch (error: unknown) {
    console.error("[API_APP_RELEASE_POST_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 }
    );
  }
}
