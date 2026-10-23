
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const regions = {
    IND: "India",
    BR: "Brazil",
    US: "United States",
    SAC: "South America",
    NA: "North America",
    EU: "Europe",
    ID: "Indonesia",
    SG: "Singapore",
    TH: "Thailand",
    VN: "Vietnam",
    TW: "Taiwan",
    ME: "Middle East",
    PK: "Pakistan"
  };

  const region = String(req.query.region || "").toUpperCase();

  if (region) {
    if (!regions[region]) {
      return res.status(400).json({
        success: false,
        error: "Unsupported region",
        supported_regions: regions
      });
    }

    return res.status(200).json({
      success: true,
      region,
      name: regions[region],
      live_status: "UNKNOWN",
      message: "Region listed; live game-server status is not verified"
    });
  }

  return res.status(200).json({
    success: true,
    game: "Free Fire",
    regions
  });
}

