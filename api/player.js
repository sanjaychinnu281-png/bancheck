const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
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
        player_info: { nickname: "N/A", level: "N/A", likes: "N/A", region: region.toUpperCase() },
        error: null
    };

    // यह प्रॉक्सी हमारी रिक्वेस्ट को इंडियन IP से भेजेगी (ताकि Garena ब्लॉक न करे)
    const proxyAgent = new HttpsProxyAgent('http://165.227.108.194:80'); 

    // --- 1. असली बैन चेक (Proxy के जरिए) ---
    try {
        const banUrl = `https://ff.garena.com/api/antihack/check_banned?uid=${uid}`;
        
        const banRes = await axios.get(banUrl, {
            httpsAgent: proxyAgent, // प्रॉक्सी का इस्तेमाल
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
        result.error = "Ban check failed. Proxy might be down.";
    }

    // --- 2. प्लेयर इन्फो (आपकी दी हुई API से) ---
    try {
        const infoUrl = `https://free-fire-info-ob55.vercel.app/player-info?uid=${uid}`;
        const infoRes = await axios.get(infoUrl, { httpsAgent: proxyAgent });

        if (infoRes.data) {
            const info = infoRes.data;
            result.player_info = {
                nickname: info.nickname || info.name || result.player_info.nickname,
                level: info.level || "N/A",
                likes: info.likes || info.liked || "N/A",
                region: info.region || region.toUpperCase()
            };
        }
    } catch (err) {
        // अगर इन्फो फेल हो जाए तो कोई बात नहीं, बैन चेक तो काम करेगा
    }

    return res.status(200).json(result);
};
