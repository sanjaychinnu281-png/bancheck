
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    api: "BANcheck",
    status: "online",
    player_data_source: "not_configured",
    ban_verification: "not_configured"
  });
}

