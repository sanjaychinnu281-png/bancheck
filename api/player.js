const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // अब URL में UID के साथ region भी डाल सकते हैं (जैसे: ?uid=123&region=BD)
    const { uid, region = 'ind' } = req.query;

    if (!uid) {
        return res.status(400).json({ status: false, message: "UID required." });
    }

    let result = {
        status: "success",
        uid: uid,
        region: region.toUpperCase(),
        is_banned: false,
        ban_message: "Not Banned ✅",
        player_info: {
            nickname: "N/A",
            level: "N/A",
            likes: "N/A",
            region: region.toUpperCase()
        },
        error: null
    };

    // --- 1. BAN CHECK (Garena Official - Ye sabhi regions ke liye kaam karta hai) ---
    try {
        const banUrl = `https://ff.garena.com/api/antihack/check_banned?uid=${uid}&region=${region}`;
        const banRes = await axios.get(banUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://ff.garena.com/' }
        });
        if (banRes.data && banRes.data.data) {
            result.is_banned = banRes.data.data.is_banned === 1;
            result.ban_message = result.is_banned ? "Player is Banned ❌" : "Not Banned ✅";
            if (banRes.data.data.nickname) result.player_info.nickname = banRes.data.data.nickname;
        }
    } catch (err) {
        result.error = "Ban check failed.";
    }

    // --- 2. PLAYER INFO (Multi-Region Support) ---
    try {
        // Ye API aapke diye gaye region (IND, BD, PK, etc.) ke hisaab se data laayegi
        const infoUrl = `https://api.ff.garena.com/player/${uid}/profile?region=${region.toUpperCase()}`;
        
        const infoRes = await axios.get(infoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                // Yahan ek dummy API key ya basic auth lagana pad sakta hai agar public na ho
                'Accept': 'application/json'
            }
        });

        if (infoRes.data && infoRes.data.basicInfo) {
            const info = infoRes.data.basicInfo;
            result.player_info = {
                nickname: info.nickname || result.player_info.nickname,
                level: info.level || "N/A",
                likes: info.liked || "N/A",
                region: info.region || region.toUpperCase()
            };
        }
    } catch (err) {
        // Agar upar wala fail ho, toh fallback library try karein jo multi-region support karti hai
        try {
            // Fallback: Shan-ffapi library (Ye multi-region support karti hai)
            const { FreeFireAPI } = require('shan-ffapi');
            const api = new FreeFireAPI();
            const profile = await api.getPlayerProfile(uid, region.toUpperCase());
            
            result.player_info = {
                nickname: profile.basicinfo.nickname || "N/A",
                level: profile.basicinfo.level || "N/A",
                likes: profile.basicinfo.liked || "N/A",
                region: profile.basicinfo.region || region.toUpperCase()
            };
        } catch (fallbackErr) {
            result.error = "Info fetch failed. Please check the region code.";
        }
    }

    return res.status(200).json(result);
};
