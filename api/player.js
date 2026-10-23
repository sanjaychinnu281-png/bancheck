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

    // Free Indian Proxy (Agar ye kaam na kare to dusra lagana padega)
    const proxyAgent = new HttpsProxyAgent('http://103.152.112.162:80'); 

    try {
        // 1. Ban Check via Proxy
        const banUrl = `https://ff.garena.com/api/antihack/check_banned?uid=${uid}`;
        const banRes = await axios.get(banUrl, {
            httpsAgent: proxyAgent,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://ff.garena.com/' }
        });
        
        if (banRes.data && banRes.data.data) {
            result.is_banned = banRes.data.data.is_banned === 1;
            result.ban_message = result.is_banned ? "Player is Banned ❌" : "Not Banned ✅";
            if (banRes.data.data.nickname) result.player_info.nickname = banRes.data.data.nickname;
        }
    } catch (err) {
        result.error = "Ban check failed (Proxy issue).";
    }

    // 2. Player Info via Proxy
    try {
        const infoUrl = `https://freefireinfo.vercel.app/api/info?uid=${uid}&region=${region}`;
        const infoRes = await axios.get(infoUrl, {
            httpsAgent: proxyAgent
        });

        if (infoRes.data && infoRes.data.success) {
            result.player_info = {
                nickname: infoRes.data.data.nickname || result.player_info.nickname,
                level: infoRes.data.data.level || "N/A",
                likes: infoRes.data.data.likes || "N/A",
                region: infoRes.data.data.region || region.toUpperCase()
            };
        }
    } catch (err) {
        result.error = (result.error ? result.error + " | " : "") + "Info failed.";
    }

    return res.status(200).json(result);
};
