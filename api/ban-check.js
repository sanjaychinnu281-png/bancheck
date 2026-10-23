
const REGIONS = [
  "IND", "BR", "US", "SAC", "NA", "EU",
  "ID", "SG", "TH", "VN", "TW", "ME", "PK"
];

export default function handler(req, res) {
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

  if (!REGIONS.includes(region)) {
    return res.status(400).json({
      success: false,
      error: "Unsupported region",
      supported_regions: REGIONS
    });
  }

  return res.status(200).json({
    success: true,
    game: "Free Fire",
    uid,
    region,
    ban_status: "UNKNOWN",
    verified: false,
    message: "A reliable ban verification source is not connected"
  });
}
