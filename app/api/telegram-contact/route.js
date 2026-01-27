const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  try {
    console.log("TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "OK" : "NO");
    console.log("CHAT_ID:", process.env.TELEGRAM_CHAT_ID ? "OK" : "NO");

    const contentType = request.headers.get("content-type") || "";
    let body = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = {
        name: formData.get("name"),
        contractNumber: formData.get("contractNumber"),
        phone: formData.get("phone"),
        message: formData.get("message"), // opcional
      };
    } else {
      console.error("Content-Type no soportado:", contentType);
      return new Response(
        JSON.stringify({ ok: false, error: "Content-Type no soportado" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Normaliza a string (como el de GM)
    const name = String(body?.name ?? "").trim();
    const contractNumber = String(body?.contractNumber ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const message = String(body?.message ?? "").trim();

    // Validación mínima (si quieres que sea obligatorio)
    if (!name || !contractNumber || !phone) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan campos." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Faltan variables de entorno");
      return new Response(
        JSON.stringify({ ok: false, error: "Faltan variables de entorno" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // ✅ Mensaje SIEMPRE con emojis (estilo GM)
    const msg =
      `✅ Nuevo contacto desde CREDITONISSAN ✅\n\n` +
      `👤 Nombre: ${name}\n` +
      `📄 Contrato: ${contractNumber}\n` +
      `📞 Teléfono: ${phone}\n` +
      (message ? `\n📝 Nota: ${message}\n` : "");

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg, // 👈 clave: mandar msg directo
      }),
    });

    const data = await response.json();
    console.log("Telegram response:", data);

    if (!response.ok || !data.ok) {
      console.error("Error de Telegram:", data);
      return new Response(
        JSON.stringify({
          ok: false,
          error: data.description || "Error al enviar a Telegram",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("ERROR en handler:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || "Error interno",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}
