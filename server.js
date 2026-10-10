
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return Response.json(
        { message: "Francis School AI backend is running." },
        { headers: corsHeaders }
      );
    }

    try {
      if (!env.GEMINI_API_KEY) {
        return Response.json(
          { error: "Server API key is not configured." },
          { status: 500, headers: corsHeaders }
        );
      }

      const body = await request.json();
      const message = String(body.message || "").trim();

      if (!message) {
        return Response.json(
          { error: "Please enter a question." },
          { status: 400, headers: corsHeaders }
        );
      }

      if (message.length > 6000) {
        return Response.json(
          { error: "Please shorten your question." },
          { status: 400, headers: corsHeaders }
        );
      }

      const apiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{
                text: "You are Francis, a friendly school tutor. Help students learn Mathematics, Biology, Science, English, Civic Education, Food and Nutrition, Chinyanja, and other subjects. Explain step by step using simple language and examples."
              }]
            },
            contents: [{
              role: "user",
              parts: [{ text: message }]
            }]
          })
        }
      );

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        return Response.json(
          { error: "The AI service could not answer. Check the server configuration." },
          { status: 502, headers: corsHeaders }
        );
      }

      const answer = data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

      if (!answer) {
        return Response.json(
          { error: "Francis did not return an answer. Please try again." },
          { status: 502, headers: corsHeaders }
        );
      }

      return Response.json(
        { answer },
        { headers: corsHeaders }
      );

    } catch (error) {
      return Response.json(
        { error: "Request failed. Please try again." },
        { status: 400, headers: corsHeaders }
      );
    }
  }
};
                             
