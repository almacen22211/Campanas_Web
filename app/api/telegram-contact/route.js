export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let name, email, phone, message;

    if (contentType.includes("application/json")) {
      // Cuando el frontend manda JSON
      const body = await request.json();
      ({ name, email, phone, message } = body);
    } else {
      // Cuando viene de un <form> normal (x-www-form-urlencoded o multipart/form-data)
      const formData = await request.formData();
      name = formData.get("name");
      email = formData.get("email");
      phone = formData.get("phone");
      message = formData.get("message");
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Faltan variables de entorno" }),
        { status: 500 }
      );
    }

    const text = `
📩 Nuevo contacto desde tu web:

👤 Nombre: ${name || "-"}
📧 Email: ${email || "-"}
📱 Teléfono: ${phone || "-"}
📝 Mensaje:
${message || "-"}
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: data.description }),
        { status: 500 }
      );
    }

    // Opcional: redirigir después del submit si viene de un formulario
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500 }
    );
  }
}
