// api/search.js

export default async function handler(req, res) {
    // 1. 设置允许访问的域名白名单 (CORS)
    const ALLOWED_ORIGINS = [
        'https://icon.guankan.tk', // 您的网站
        'http://ifeng.app'      // 本地调试用
    ];

    const origin = req.headers.origin;
    
    // 检查 Origin 是否在白名单中
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // 如果是调试阶段，为了方便，您可以暂时设为 '*' (允许所有)，但正式上线建议用白名单
        // res.setHeader('Access-Control-Allow-Origin', '*'); 
        // 如果严格模式，不在白名单则不返回 CORS 头，浏览器会拦截
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 处理预检请求 (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. 获取 URL 参数
    // Vercel 会自动把 URL 参数解析到 req.query 中
    const { term, region = 'cn', limit = 18 } = req.query;

    if (!term) {
        return res.status(400).json({ error: '请输入搜索关键词' });
    }

    // 4. 构造 Apple API 地址
    const appleApiUrl = new URL('https://itunes.apple.com/search');
    appleApiUrl.searchParams.set('term', term);
    appleApiUrl.searchParams.set('entity', 'software');
    appleApiUrl.searchParams.set('country', region);
    appleApiUrl.searchParams.set('limit', limit);

    try {
        // 5. 发起请求 (带重试机制和伪装)
        const maxRetries = 2; // 最大重试次数
        let response;
        let fetchError;

        for (let i = 0; i <= maxRetries; i++) {
            try {
                response = await fetch(appleApiUrl.toString(), {
                    headers: {
                        // 关键：伪装成 macOS Safari，防止 Apple 返回 403
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                });

                if (response.ok) break; // 成功则跳出循环
            } catch (err) {
                fetchError = err;
            }
            // 如果失败，等待 500ms 再重试
            if (i < maxRetries) await new Promise(r => setTimeout(r, 500));
        }

        if (!response || !response.ok) {
             // 即使重试了也失败
            const status = response ? response.status : 500;
            return res.status(status).json({ error: 'Apple API 请求失败，请稍后重试' });
        }

        const data = await response.json();

        // 6. 数据瘦身处理 (为了兼容您的前端)
        const results = (data.results || []).map(app => {
            // 图标逻辑
            const artwork = app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60 || '';
            
            return {
                trackId: app.trackId,
                trackName: app.trackName,
                artworkUrl512: artwork,
                bundleId: app.bundleId,
                version: app.version,
                fileSizeBytes: app.fileSizeBytes,
                currentVersionReleaseDate: app.currentVersionReleaseDate,
                formattedPrice: app.formattedPrice,
                trackViewUrl: app.trackViewUrl,
                price: app.price
            };
        });

        // 7. 返回最终 JSON
        return res.status(200).json({
            resultCount: data.resultCount,
            results: results
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
