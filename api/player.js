const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { uid } = req.query;

    if (!uid) {
        return res.status(400).json({ status: false, message: "UID required. Example: ?uid=12345678" });
    }

    let result = {
        status: "success",
        uid: uid,
        is_banned: false,
        ban_message: "Not Banned ✅",
        player_info: {
            nickname: "N/A",
            level: "N/A",
            likes: "N/A",
            region: "N/A"
        },
        error: null
    };

    // --- 1. BAN CHECK (Official Garena Endpoint) ---
    try {
        const banUrl = `https://ff.garena.com/api/antihack/check_banned?uid=${uid}`;
        const banRes = await axios.get(banUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
                'Referer': 'https://ff.garena.com/'
            }
        });

        if (banRes.data && banRes.data.data) {
            result.is_banned = banRes.data.data.is_banned === 1;
            result.ban_message = result.is_banned ? "Player is Banned ❌" : "Not Banned ✅";
            if (banRes.data.data.nickname) {
                result.player_info.nickname = banRes.data.data.nickname;
            }
        }
    } catch (err) {
        result.error = "Ban check failed.";
    }

    // --- 2. PLAYER INFO (Public Community API) ---
    try {
        // Ye ek open-source API hai jo Vercel se block nahi hoti
        const infoUrl = `https://info-free-fire-api.vercel.app/info?uid=${uid}`;
        const infoRes = await axios.get(infoUrl);

        if (infoRes.data && infoRes.data.status === "success") {
            const info = infoRes.data.data;
            result.player_info = {
                nickname: info.nickname || result.player_info.nickname,
                level: info.level || "N/A",
                likes: info.likes || "N/A",
                region: info.region || "N/A"
            };
        } else {
             // Agar yahan bhi fail ho, toh backup library try karein
             throw new Error("Primary info API failed");
        }

    } catch (err) {
        // Backup option: Try using a different free API if the first one fails
        try {
            const backupUrl = `https://ff-api-psi.vercel.app/info?uid=${uid}`;
            const backupRes = await axios.get(backupUrl);
            
            if(backupRes.data && backupRes.data.nickname) {
                 result.player_info = {
                    nickname: backupRes.data.nickname,
                    level: backupRes.data.level || "N/A",
                    likes: backupRes.data.likes || "N/A",
                    region: backupRes.data.region || "N/A"
                };
            }
        } catch (backupErr) {
            result.error = "Player Info fetch failed. Garena API is restricted.";
        }
    }

    return res.status(200).json(result);
};
