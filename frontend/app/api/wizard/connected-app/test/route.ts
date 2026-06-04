import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url, method, headers, body } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    const start = Date.now();

    // Safe parse headers
    let fetchHeaders: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    if (headers) {
      try {
        const parsed = typeof headers === "string" ? JSON.parse(headers) : headers;
        fetchHeaders = { ...fetchHeaders, ...parsed };
      } catch (e) {
        console.error("Failed to parse headers", e);
      }
    }

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: fetchHeaders,
    };

    if (body && ["POST", "PUT", "PATCH", "DELETE"].includes(fetchOptions.method || "")) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - start;

    let responseBodyText = "";
    let responseBodyJson = null;

    try {
      responseBodyText = await response.text();
      responseBodyJson = JSON.parse(responseBodyText);
    } catch {
      // Not JSON or empty
    }

    // Capture standard headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      durationMs: duration,
      body: responseBodyJson || responseBodyText || null,
    });
  } catch (err: any) {
    console.error("[API Proxy Test Error]", err);
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        statusText: "Internal Server Proxy Error",
        body: { error: err.message }
      },
      { status: 500 }
    );
  }
}
