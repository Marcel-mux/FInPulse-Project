export interface SendWhatsAppMessageParams {
  target: string;
  message: string;
}

export interface FonnteResponse {
  status: boolean;
  target?: string[];
  id?: string[];
  process?: string;
  reason?: string;
  detail?: string;
}

/**
 * Mengirim pesan WhatsApp melalui gateway Fonnte (https://api.fonnte.com/send)
 */
export async function sendWhatsAppMessage({
  target,
  message,
}: SendWhatsAppMessageParams): Promise<{
  success: boolean;
  status: number;
  data?: FonnteResponse | null;
  error?: string;
}> {
  const token =
    process.env.FONNTE_TOKEN?.trim() ||
    process.env.FONTTE_TOKEN?.trim();

  if (!token) {
    console.warn(
      "[FONNTE WARNING] FONNTE_TOKEN atau FONTTE_TOKEN belum disetel di environment variables."
    );
    return {
      success: false,
      status: 500,
      error: "FONNTE_TOKEN belum dikonfigurasi.",
    };
  }

  // Bersihkan target dari karakter non-digit
  const cleanTarget = target.replace(/\D/g, "");

  console.log(`[FONNTE /send] Mengirim pesan ke target: ${cleanTarget}`);
  console.log(`[FONNTE /send] Isi pesan:\n${message}`);

  try {
    const formData = new FormData();
    formData.append("target", cleanTarget);
    formData.append("message", message);

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        // Penting: Fonnte hanya butuh token murni tanpa prefix 'Bearer '
        Authorization: token,
      },
      body: formData,
    });

    const responseData = (await response.json().catch(() => null)) as FonnteResponse | null;
    console.log(
      `[FONNTE /send RESPONSE] HTTP ${response.status}:`,
      JSON.stringify(responseData)
    );

    const isSuccess = response.ok && Boolean(responseData?.status);

    return {
      success: isSuccess,
      status: response.status,
      data: responseData,
      error: !isSuccess ? responseData?.reason || responseData?.detail || "Gagal mengirim via Fonnte" : undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error ke Fonnte";
    console.error("[FONNTE /send ERROR]", errorMsg);
    return {
      success: false,
      status: 500,
      error: errorMsg,
    };
  }
}
