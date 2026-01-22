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

        // ✅ compatibilidad si alguien manda message
        message: formData.get("message"),
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

    const { name, contractNumber, phone, message } = body || {};

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

    // ✅ Si viene message, úsalo; si no, arma el texto con los campos nuevos
    const details =
      (typeof message === "string" && message.trim())
        ? message
        : `👤 <b>Nombre:</b> ${name || "-"}\n📩 <b>Contrato:</b> ${contractNumber || "-"}\n📞 <b>Teléfono:</b> ${phone || "-"}`;

    const text =
      `✅ <b>Nuevo contacto desde CREDITONISSAN</b> ✅\n\n` +
      details;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",   // 👈 CLAVE
        disable_web_page_preview: true,
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
