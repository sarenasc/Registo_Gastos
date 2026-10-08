import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

// Recibe la foto de la boleta (ya comprimida en el navegador) y la guarda en
// Vercel Blob. Los Blob stores nuevos se autentican por OIDC: Vercel entrega el
// token solo y aquí solo hace falta el id del store. Si el store se conectó con
// un prefijo distinto a "BLOB", se acepta también BLOB_READ_WRITE_TOKEN_STORE_ID.
// Los stores antiguos con BLOB_READ_WRITE_TOKEN siguen funcionando igual.
const MAX_BYTES = 4 * 1024 * 1024; // límite de cuerpo de las funciones de Vercel ≈ 4,5 MB

function storeId() {
  return process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN_STORE_ID || undefined;
}

export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto es demasiado grande." }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  try {
    const blob = await put(`boletas/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
      storeId: storeId(),
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[boletas] error al subir a Vercel Blob:", error);
    return NextResponse.json({ error: "No se pudo guardar la foto." }, { status: 500 });
  }
}
