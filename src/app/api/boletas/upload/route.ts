import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

// Entrega al navegador un token temporal para subir la foto de la boleta
// directo a Vercel Blob (así no pasa por la función y no topa con su límite de
// tamaño). Solo usuarios con sesión pueden pedir el token.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await getSession())) throw new Error("No autorizado");
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
