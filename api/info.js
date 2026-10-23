
const INFO_API =
  "https://free-fire-info-ob55.vercel.app/player-info";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "GET method required"
    });
  }

  const uid = String(req.query.uid || "").trim();
  const region = String(req.query.region || "IND").toUpperCase();

  if (!/^\d{5,20}$/.test(uid)) {
    return res.status(400).json({
      success: false,
      error: "Enter a valid numeric UID"
    });
  }

  if (region !== "IND") {
    return res.status(400).json({
      success: false,
      uid,
      region,
      error: "Currently, the connected data source supports IND only"
    });
  }

  try {
    const url = new URL(INFO_API);
    url.searchParams.set("uid", uid);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000)
    });

    const body = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        uid,
        region,
        error: "Upstream player API returned an error",
        upstream_status: response.status
      });
    }

    let data;

    try {
      data = JSON.parse(body);
    } catch {
      return res.status(502).json({
        success: false,
        error: "Player API returned invalid JSON"
      });
    }

    return res.status(200).json({
      success: true,
      game: "Free Fire",
      uid,
      region,
      source: "free-fire-info-ob55",
      data
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      uid,
      region,
      error: error.name === "TimeoutError"
        ? "Player API timed out"
        : "Could not connect to player API"
    });
  }
}
