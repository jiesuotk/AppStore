// api/search.js

export default async function handler(req, res) {
    // --- 1. 简化的 CORS 设置 ---
    // 不再校验域名，直接允许所有来源 (Access-Control-Allow-Origin: *)
    // 安全性完全由下方的 API_KEY 负责
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // --- 2. 获取参数与密码 ---
    const { term, region = 'cn', limit = 18, key } = req.query;
    const API_KEY = process.env.API_KEY; // 从 Vercel 环境变量获取密码

    // --- 3. 【核心安全检查】验证 API 密码 ---
    // 只有当 URL 里的 key 等于环境变量里的 API_KEY 时才放行
    if (API_KEY) {
        if (!key || key !== API_KEY) {
            return res.status(401).json({ error: 'Unauthorized: 访问密码错误或缺失' });
        }
    }

    // --- 4. 正常的 Apple 搜索逻辑 ---
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
                // 伪装成 macOS Safari，防止 Apple 返回 403
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15'
            }
        });

        if (!response.ok) {
            throw new Error(`Apple API Error: ${response.status}`);
        }

        const data = await response.json();

        // 数据瘦身处理
        const cleanResults = (data.results || []).map(app => {
            
            return {
                trackId: app.trackId,
                trackName: app.trackName,
                // --- 【核心修改：直接返回2个尺寸的 URL】 ---
                artworkUrl100: app.artworkUrl100,
                artworkUrl512: app.artworkUrl512,
                // ------------------------------------------
                bundleId: app.bundleId,
                version: app.version,
                fileSizeBytes: app.fileSizeBytes,
                currentVersionReleaseDate: app.currentVersionReleaseDate,
                formattedPrice: app.formattedPrice,
                trackViewUrl: app.trackViewUrl,
                price: app.price
            };
        });

        return res.status(200).json({
            resultCount: data.resultCount,
            results: cleanResults
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
