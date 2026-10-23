const axios = require('axios');
const FreeFireAPI = require('@pure0cd/freefire-api');

module.exports = async (req, res) => {
    // CORS allow
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { uid } = req.query;

    if (!uid) {
        return res.status(400).json({ 
            status: false, 
            message: "UID required. Example: ?uid=17848065004" 
        });
    }

    let result = {
        status: "success",
        uid: uid,
        is_banned: false,
        ban_message: "Not Banned ✅",
        player_info: null,
        error: null
    };

    // --- 1. BAN CHECK (Garena Official Endpoint) ---
    try {
        const banUrl = `https://ff.garena.com/api/antihack/check_banned?uid=${uid}`;
        const banRes = await axios.get(banUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://ff.garena.com/'
            }
        });

        if (banRes.data && banRes.data.data) {
            const isBanned = banRes.data.data.is_banned === 1;
            result.is_banned = isBanned;
            result.ban_message = isBanned ? "Player is Banned ❌" : "Not Banned ✅";
            // अगर Garena से निकनेम मिल जाए तो सेव कर लें
            if (banRes.data.data.nickname) {
                result.player_info = result.player_info || {};
                result.player_info.nickname = banRes.data.data.nickname;
            }
        }
    } catch (err) {
        result.error = "Ban check failed: " + err.message;
    }

    // --- 2. FULL PLAYER INFO (Library) ---
    try {
        const api = new FreeFireAPI();
        // Auto-login with default credentials
        await api.login(); 

        // प्रोफाइल निकालें (इसमें level, likes, region आदि आते हैं)
        const profile = await api.getPlayerProfile(uid);
        
        // लाइब्रेरी का रिस्पॉन्स स्ट्रक्चर अलग हो सकता है, इसलिए सेफ तरीके से एक्सेस करें
        // आमतौर पर डेटा basicinfo या सीधे ऑब्जेक्ट में होता है
        const info = profile.basicinfo || profile.basicInfo || profile;
        
        result.player_info = {
            nickname: info.nickname || (result.player_info ? result.player_info.nickname : "Unknown"),
            level: info.level || "N/A",
            likes: info.liked || info.likes || "N/A",
            region: info.region || "N/A",
            // अगर और भी फील्ड चाहिए तो यहाँ जोड़ सकते हैं
            // exp: info.exp,
            // create_at: info.createat
        };

    } catch (err) {
        // अगर लाइब्रेरी फेल हो जाए तो कम से कम बैन वाला डेटा तो रहे
        if (!result.player_info) {
            result.player_info = { nickname: "Unknown (Info fetch failed)" };
        }
        result.error = (result.error ? result.error + " | " : "") + "Info fetch failed: " + err.message;
    }

    // रिजल्ट भेजें
    return res.status(200).json(result);
};