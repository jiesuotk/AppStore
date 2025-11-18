// api/search.js

export default async function handler(req, res) {
    // 1. 从环境变量获取配置
    const API_KEY = process.env.API_KEY; // 获取设置的密码
    const ALLOWED_ORIGINS_STR = process.env.ALLOWED_ORIGINS || ''; // 获取白名单字符串
    // 将逗号分隔的字符串转为数组，并去除多余空格
    const ALLOWED_ORIGINS = ALLOWED_ORIGINS_STR.split(',').map(o => o.trim());

    // 2. 处理 CORS (使用环境变量中的白名单)
    const origin = req.headers.origin;
    
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 获取 URL 参数 (包括 key)
    const { term, region = 'cn', limit = 18, key } = req.query;

    // 4. 【安全检查】验证 API 密码
    // 如果在 Vercel 后台设置了 API_KEY，就强制检查
    if (API_KEY) {
        if (!key || key !== API_KEY) {
            // 密码不对或没传密码，直接拒绝
            return res.status(401).json({ error: 'Unauthorized: 访问密码错误或缺失' });
        }
    }

    // --- 正常的 Apple 搜索逻辑 ---
    if (!term) {
        return res.status(400).json({ error: '请输入搜索关键词' });
    }

    const appleUrl = new URL('https://itunes.apple.com/search');
    appleUrl.searchParams.set('term', term);
    appleUrl.searchParams.set('country', region);
    appleUrl.searchParams.set('entity', 'software');
    appleUrl.searchParams.set('limit', limit);

    try {
        const response = await fetch(appleUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15'
            }
        });

        if (!response.ok) {
            throw new Error(`Apple API Error: ${response.status}`);
        }

        const data = await response.json();

        const cleanResults = (data.results || []).map(app => ({
            trackId: app.trackId,
            trackName: app.trackName,
            artworkUrl512: app.artworkUrl512 || app.artworkUrl100,
            bundleId: app.bundleId,
            version: app.version,
            fileSizeBytes: app.fileSizeBytes,
            currentVersionReleaseDate: app.currentVersionReleaseDate,
            formattedPrice: app.formattedPrice,
            trackViewUrl: app.trackViewUrl,
            price: app.price
        }));

        return res.status(200).json({
            resultCount: data.resultCount,
            results: cleanResults
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
