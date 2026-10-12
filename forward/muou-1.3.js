WidgetMetadata = {
  id: "forward.muou.multi",
  title: "木偶4K · 夸克/百度",
  version: "1.4.0",
  requiredVersion: "0.0.1",
  description: "Forward 专用按需加载版：采集木偶站列表/搜索/详情，聚合夸克与百度网盘播放源；Cookie 持久化，episodeItems 仅提供剧集列表元信息，单集播放资源通过 loadResource(stream) 按需加载。",
  author: "Operit",
  site: "https://www.muou.site",
  detailCacheDuration: 0,
  globalParams: [
    {
      name: "site",
      title: "站点",
      type: "enumeration",
      value: "https://www.muou.site",
      enumOptions: [
        { title: "木偶主站", value: "https://www.muou.site" },
        { title: "木偶亚洲", value: "https://www.muou.asia" },
        { title: "线路 123", value: "https://123.666291.xyz" },
        { title: "线路 666", value: "https://666.666291.xyz" }
      ]
    },
    {
      name: "quarkCookie",
      title: "夸克 Cookie",
      type: "input",
      placeholders: [
        { title: "填入完整 Cookie，必须包含有效登录态", value: "" }
      ]
    },
    {
      name: "baiduCookie",
      title: "百度网盘 Cookie",
      type: "input",
      placeholders: [
        { title: "必须含有效 BDUSS，取直链用", value: "" }
      ]
    },
    {
      name: "baiduMaxLinks",
      title: "详情页百度解析上限",
      type: "enumeration",
      value: "20",
      enumOptions: [
        { title: "10 个", value: "10" },
        { title: "20 个", value: "20" },
        { title: "40 个", value: "40" },
        { title: "全部", value: "0" }
      ]
    },
    {
      name: "preloadCount",
      title: "详情页预取播放数量",
      type: "enumeration",
      value: "3",
      enumOptions: [
        { title: "1 个", value: "1" },
        { title: "2 个", value: "2" },
        { title: "3 个", value: "3" },
        { title: "5 个", value: "5" },
        { title: "10 个", value: "10" },
        { title: "全部", value: "0" }
      ]
    }
  ],
  modules: [
    {
      id: "movies",
      title: "电影",
      functionName: "loadCategory",
      cacheDuration: 600,
      params: [
        { name: "categoryId", title: "分类", type: "constant", value: "1" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "tv",
      title: "剧集",
      functionName: "loadCategory",
      cacheDuration: 600,
      params: [
        { name: "categoryId", title: "分类", type: "constant", value: "2" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "anime",
      title: "动漫",
      functionName: "loadCategory",
      cacheDuration: 600,
      params: [
        { name: "categoryId", title: "分类", type: "constant", value: "3" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "variety",
      title: "综艺",
      functionName: "loadCategory",
      cacheDuration: 600,
      params: [
        { name: "categoryId", title: "分类", type: "constant", value: "29" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "documentary",
      title: "纪录片",
      functionName: "loadCategory",
      cacheDuration: 600,
      params: [
        { name: "categoryId", title: "分类", type: "constant", value: "4" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "baiduDiagnostics",
      title: "百度诊断",
      functionName: "loadBaiduDiagnostics",
      cacheDuration: 0,
      params: [
        {
          name: "shareUrl",
          title: "百度分享链接（留空=最近一次详情页的）",
          type: "input",
          placeholders: [{ title: "https://pan.baidu.com/s/1xxxx?pwd=yyyy", value: "" }]
        }
      ]
    },
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: []
    }
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const CACHE_FOLDER = "ftv-cache";
const STORAGE_COOKIE_KEY = "forward.muou.quark.cookie";
const STORAGE_SITE_KEY = "forward.muou.quark.site";
const STORAGE_PRELOAD_KEY = "forward.muou.quark.preloadCount";
let CURRENT_COOKIE = "";

function getSite(params) {
  const incoming = params && params.site ? String(params.site).trim() : "";
  if (incoming) {
    safeStorageSet(STORAGE_SITE_KEY, incoming);
    return incoming.replace(/\/$/, "");
  }
  const saved = safeStorageGet(STORAGE_SITE_KEY);
  return String(saved || "https://www.muou.site").replace(/\/$/, "");
}

function safeStorageGet(key) {
  try {
    return Widget && Widget.storage && Widget.storage.get ? Widget.storage.get(key) : "";
  } catch (e) {
    console.log("[Storage] get failed:", key, e.message || e);
    return "";
  }
}

function safeStorageSet(key, value) {
  try {
    if (Widget && Widget.storage && Widget.storage.set) Widget.storage.set(key, value);
  } catch (e) {
    console.log("[Storage] set failed:", key, e.message || e);
  }
}

function normalizeCookie(cookie) {
  return String(cookie || "").trim();
}

function ensureCookie(cookie) {
  const incoming = normalizeCookie(cookie);
  if (incoming) {
    CURRENT_COOKIE = incoming;
    safeStorageSet(STORAGE_COOKIE_KEY, incoming);
    return CURRENT_COOKIE;
  }
  if (CURRENT_COOKIE) return CURRENT_COOKIE;
  CURRENT_COOKIE = normalizeCookie(safeStorageGet(STORAGE_COOKIE_KEY));
  return CURRENT_COOKIE;
}

function getPreloadCount(params) {
  const incoming = params && params.preloadCount !== undefined ? Number(params.preloadCount) : NaN;
  if (!Number.isNaN(incoming)) {
    const n = Math.max(0, Math.floor(incoming));
    safeStorageSet(STORAGE_PRELOAD_KEY, String(n));
    return n;
  }
  const saved = Number(safeStorageGet(STORAGE_PRELOAD_KEY));
  if (!Number.isNaN(saved)) return Math.max(0, Math.floor(saved));
  return 3;
}

function bindForwardParams(params = {}) {
  getSite(params);
  getPreloadCount(params);
  const ck = params.quarkCookie || params.cookie || params.quarkck || "";
  ensureCookie(ck);
  baiduCookie(params || {});
}

function getBaiduMaxLinks(params = {}) {
  const raw = params.baiduMaxLinks !== undefined ? params.baiduMaxLinks : safeStorageGet("forward.muou.baidu.maxLinks");
  const n = Number(raw);
  if (Number.isNaN(n)) return 20;
  return Math.max(0, Math.floor(n));
}

function muouProviderName(provider) {
  if (provider === "baidu") return "百度";
  if (provider === "uc") return "UC";
  return "夸克";
}

// 季集识别：跨网盘把同一集聚到一起
function episodeIdentity(fileName) {
  const name = String(fileName || "").replace(/\.[a-z0-9]{2,5}$/i, "");
  const se = name.match(/s(\d{1,2})[ ._-]*e(\d{1,3})(?!\d)/i);
  if (se) return { key: "s" + Number(se[1]) + "e" + Number(se[2]), season: Number(se[1]), episode: Number(se[2]) };
  const season = name.match(/第\s*(\d+)\s*季/);
  const ep = name.match(/第\s*(\d{1,3})\s*[集话期]/) || name.match(/(?:^|[^a-z])(?:ep?|episode)[ ._-]*(\d{1,3})(?!\d)/i);
  if (ep) return { key: "s" + (season ? Number(season[1]) : 1) + "e" + Number(ep[1]), season: season ? Number(season[1]) : 1, episode: Number(ep[1]) };
  return { key: "name:" + name.toLowerCase().replace(/[\s._\-]+/g, ""), episode: undefined, display: name };
}

function looksLikeEpisodeName(name) {
  return /第\s*\d+\s*[集话期]|\bS\d{1,2}\s*E\d{1,3}\b|\bE[Pp]?\s*\d{1,3}\b/i.test(String(name || ""));
}

// 从详情页提取网盘分享行（标题 + 链接）
function collectPanRows($, html) {
  const rows = [];
  const seen = {};
  const clean = u => String(u || "").replace(/[)\]】），。；,;、]+$/, "").trim();
  const push = (title, url) => {
    const u = clean(url);
    if (!u || !/^https?:\/\//i.test(u)) return;
    if (seen[u]) return;
    seen[u] = true;
    rows.push({ title: String(title || "").trim(), url: u });
  };
  const scan = (text, title) => {
    const urls = String(text || "").match(/https?:\/\/[^\s"'<>]+/g) || [];
    urls.forEach(u => push(title, u));
  };
  const nodes = $(".module-row-one, .module-row-info, .down-list li, .module-list .module-row");
  nodes.each((i, el) => {
    const node = $(el);
    const title = (node.find("h4").first().text() || node.find(".module-row-title").first().text() || "").trim();
    let text = node.text() || "";
    node.find("a, p, input").each((j, sub) => {
      const s = $(sub);
      text += " " + (s.attr("href") || "") + " " + (s.attr("data-clipboard-text") || "") + " " + (s.attr("value") || "");
    });
    scan(text, title);
  });
  if (!rows.length) scan(html, "");
  return rows;
}

function toQuery(obj) {
  return Object.keys(obj || {}).map(k => k + "=" + encodeURIComponent(obj[k])).join("&");
}

function absUrl(url, site) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return site + url;
  return site + "/" + url;
}

function pickText($, el, selector) {
  return $(el).find(selector).text().trim();
}

function idFromHref(href) {
  const s = String(href || "");
  const m = s.match(/\/detail\/id\/(\d+)\.html/) || s.match(/\/vod\/detail\/id\/(\d+)\.html/) || s.match(/id\/(\d+)/);
  return m ? m[1] : s;
}

function encodeLink(obj) {
  return "muou:" + encodeURIComponent(JSON.stringify(obj));
}

function decodeLink(link) {
  const raw = String(link || "");
  if (!raw.startsWith("muou:")) return null;
  try { return JSON.parse(decodeURIComponent(raw.slice(5))); } catch (_) { return null; }
}

async function httpText(url, options) {
  const res = await Widget.http.get(url, options || {});
  return typeof res.data === "string" ? res.data : JSON.stringify(res.data || "");
}

async function httpJson(method, url, data, headers) {
  const baseHeaders = headers || quarkHeaders();
  let res;
  if (method === "POST") {
    res = await Widget.http.post(url, JSON.stringify(data || {}), {
      headers: Object.assign({}, baseHeaders, { "Content-Type": "application/json" })
    });
  } else {
    res = await Widget.http.get(url, { headers: baseHeaders });
  }
  return typeof res.data === "string" ? JSON.parse(res.data) : res.data;
}

function quarkHeaders(cookie) {
  const ck = ensureCookie(cookie);
  return {
    "User-Agent": UA,
    "Cookie": ck,
    "Referer": "https://pan.quark.cn/"
  };
}

function playHeaders() {
  return { "User-Agent": UA, "Cookie": CURRENT_COOKIE };
}

async function loadCategory(params = {}) {
  bindForwardParams(params);
  const site = getSite(params);
  const page = Number(params.page || 1);
  const tid = String(params.categoryId || "1");
  const url = `${site}/index.php/vod/show/id/${tid}/page/${page}.html`;
  const html = await httpText(url);
  const $ = Widget.html.load(html);
  const list = [];

  $(".module-item").each((i, el) => {
    const a = $(el).find(".module-item-title");
    const href = a.attr("href") || "";
    const title = a.attr("title") || a.text().trim();
    const poster = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    const remark = pickText($, el, ".module-item-text");
    const id = idFromHref(href);
    if (id && title) {
      list.push({
        id: `muou-${id}`,
        type: "url",
        title,
        posterPath: absUrl(poster, site),
        description: remark,
        link: encodeLink({ action: "detail", id, site })
      });
    }
  });
  return list;
}

async function search(params = {}) {
  bindForwardParams(params);
  const keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  const site = getSite(params);
  const url = `${site}/index.php/vod/search.html?wd=${encodeURIComponent(keyword)}`;
  const html = await httpText(url);
  const $ = Widget.html.load(html);
  const list = [];

  $(".module-search-item").each((i, el) => {
    const a = $(el).find("h3 a");
    const href = a.attr("href") || "";
    const title = a.text().trim() || $(el).find(".module-item-pic img").attr("alt") || "";
    const poster = $(el).find(".module-item-pic img").attr("data-src") || $(el).find(".module-item-pic img").attr("src") || "";
    const remark = pickText($, el, ".video-serial").replace("fuck you", "").trim();
    const id = idFromHref(href);
    if (id && title) {
      list.push({
        id: `muou-${id}`,
        type: "url",
        title,
        posterPath: absUrl(poster, site),
        description: remark,
        link: encodeLink({ action: "detail", id, site })
      });
    }
  });
  return list;
}

async function loadDetail(link, params = {}) {
  bindForwardParams(params);
  ensureCookie();
  const raw = String(link || "");
  const info = decodeLink(raw);
  if (!info) return null;
  // 选集项（type:"url" + link）被宿主当成详情项回调时，不能去抓站点的详情页，
  // 否则会请求 ".../detail/id/undefined.html" 并回一个没有任何播放地址的空详情页 ——> 播放面板空白。
  // 参考 fengye4k-forward 的 loadPlayDetail：直接回一个带 link 的最小条目，起播时再由 loadResource 取真实线路。
  if (info.action === "play" || info.action === "baiduPlay") {
    return { id: raw, type: "url", title: info.title || "木偶网盘", description: "网盘线路", link: raw };
  }
  return await buildDetailItem(info, params);
}

async function buildDetailItem(info, params = {}) {
  bindForwardParams(params);
  const site = String(info.site || "https://www.muou.site").replace(/\/$/, "");
  const tid = String(info.id || "");
  const html = await httpText(`${site}/index.php/vod/detail/id/${tid}.html`);
  const $ = Widget.html.load(html);
  const title = $(".page-title").text().trim() || `木偶-${tid}`;
  const poster = $(".video-cover img").attr("data-src") || $(".video-cover img").attr("src") || "";
  const desc = $(".video-info-item.video-info-content .sqjj_a").text().trim().replace(/\[收起部分\]/g, "");

  const panRows = collectPanRows($, html);
  const quarkRows = [];
  const baiduRows = [];
  panRows.forEach(row => {
    if (/pan\.quark\.cn\/s\//i.test(row.url)) {
      if (!quarkRows.some(r => r.url === row.url)) quarkRows.push(row);
    } else if (/pan\.baidu\.com\//i.test(row.url)) {
      if (!baiduRows.some(r => r.url === row.url)) baiduRows.push(row);
    }
  });

  // 各网盘条目：{ provider, shareUrl, title, video }
  const entries = [];
  for (let i = 0; i < quarkRows.length; i++) {
    const shareLink = quarkRows[i].url;
    let videos = [];
    try {
      const detail = await getVideosFromShareLink(shareLink);
      videos = (detail && detail.list) || [];
    } catch (e) {
      console.warn("[夸克] 分享解析失败:", e.message || e);
    }
    videos.forEach(v => entries.push({ provider: "quark", shareUrl: shareLink, title: quarkRows[i].title, video: v }));
  }

  if (baiduRows.length) safeStorageSet("forward.muou.baidu.lastShare", baiduRows[0].url);
  const baiduMax = getBaiduMaxLinks(params);
  let baiduResolved = 0;
  for (let i = 0; i < baiduRows.length; i++) {
    const row = baiduRows[i];
    if (baiduMax > 0 && baiduResolved >= baiduMax) break;
    let videos = [];
    try {
      videos = await baiduListShareVideos(row.url, params);
    } catch (e) {
      console.warn("[百度] 分享解析失败:", e.message || e);
    }
    baiduResolved++;
    videos.forEach(v => entries.push({ provider: "baidu", shareUrl: row.url, title: row.title || "", video: v }));
  }

  // 按季集聚合：同一集的夸克 / 百度合并成一个播放项，播放时聚合成多源列表
  const groups = new Map();
  entries.forEach((entry, idx) => {
    const identity = episodeIdentity(entry.video && entry.video.file_name);
    const key = entry.video && entry.video.file_name ? identity.key : "raw:" + idx;
    if (!groups.has(key)) groups.set(key, { identity: identity, entries: [] });
    groups.get(key).entries.push(entry);
  });

  const episodeItems = [];
  Array.from(groups.values()).forEach(group => {
    const first = group.entries[0];
    const epTitle = group.identity && group.identity.episode
      ? `第${group.identity.episode}集`
      : (first.title || formatVideoName(first.video.file_name, first.video.size) || "视频");
    const providers = Array.from(new Set(group.entries.map(e => muouProviderName(e.provider)))).join(" / ");
    const size = group.entries.reduce((max, e) => Math.max(max, Number((e.video && e.video.size) || 0)), 0);
    // id 与 link 用同一个"选集载荷"：不管宿主起播时把哪一项传给 loadResource，都能定位到资源
    // （参考 fengye4k-forward：episodeItems 的 id 与 link 同值）
    const payloadLink = encodeLink({
      action: "play",
      title: epTitle,
      sources: group.entries.map(e => ({
        provider: e.provider,
        shareUrl: e.shareUrl,
        title: e.title || "",
        video: e.video
      }))
    });
    episodeItems.push({
      id: payloadLink,
      type: "url",
      title: epTitle,
      description: [providers, muouSizeText(size)].filter(Boolean).join(" · "),
      link: payloadLink
    });
  });

  return {
    id: `muou-${tid}`,
    type: "url",
    title,
    posterPath: absUrl(poster, site),
    description: [desc, episodeItems.length ? `聚合 ${episodeItems.length} 集（夸克${quarkRows.length} / 百度${baiduRows.length} 分享）` : "未发现网盘分享链接"].filter(Boolean).join("\n"),
    episodeItems,
    link: encodeLink({ action: "detail", id: tid, site })
  };
}

async function muouQuarkSource(videoInfo, title) {
  const fid = await saveShareFile(videoInfo);
  if (!fid) throw new Error("转存失败");
  const urls = await getPlayUrl(fid);
  const best = urls.find(v => v.resolution === "4k") || urls.find(v => v.resolution === "2k") || urls[0];
  if (!best || !best.url) throw new Error("获取播放直链失败");
  return {
    name: title || "夸克视频",
    description: best.resolution ? `清晰度: ${best.resolution}` : "",
    url: best.url
  };
}

async function loadResource(params = {}) {
  bindForwardParams(params);
  const link = (params && params.link) || (params && params.id) || "";
  if (!link) {
    console.warn("[muou] loadResource 没收到 link/id，无法定位资源");
    return [];
  }
  const info = decodeLink(link);
  if (!info) return [];
  if (info.action === "play") {
    const sources = Array.isArray(info.sources) ? info.sources : [{ provider: "quark", video: info.videoInfo, title: info.title }];
    const resolved = [];
    for (const src of sources) {
      const pan = src.provider === "baidu" ? "百度" : "夸克";
      try {
        const item = src.provider === "baidu"
          ? await baiduPlaySource(src.video, src.shareUrl, info.title || src.title, params)
          : await muouQuarkSource(src.video, info.title || src.title);
        resolved.push({ panType: pan, size: Number((src.video && src.video.size) || 0), item: item });
      } catch (e) {
        console.warn("[muou] " + pan + " 线路失败:", e.message || e);
      }
    }
    const usable = resolved.filter(r => r.item && r.item.url);
    console.log("[muou] 聚合播放源", { total: resolved.length, usable: usable.length, lines: usable.map(r => r.panType) });
    if (!usable.length) {
      const first = (resolved[0] && resolved[0].item) || {};
      return [{ name: first.name || info.title || "木偶网盘", description: "本集所有线路获取失败 · " + (BAIDU_LAST_ERROR || "无更多信息（可运行“百度诊断”模块）"), url: "" }];
    }
    usable.sort((a, b) => muouPanPriority(a.panType) - muouPanPriority(b.panType) || b.size - a.size);
    return usable.map(r => r.item);
  }
  if (info.action === "baiduPlay") {
    try {
      let video = { fid: info.fid, file_name: info.file_name, size: info.size, dir: info.dir, group: info.group };
      if (!video.fid) {
        const videos = await baiduListShareVideos(info.shareUrl, params);
        video = videos.find(v => v.file_name === info.file_name) || videos[0] || {};
      }
      if (!video || !video.fid) {
        return [{ name: info.title || "百度网盘", description: "未找到可播放的视频文件，请重新打开详情", url: "" }];
      }
      return [await baiduPlaySource(video, info.shareUrl, info.title, params)];
    } catch (e) {
      console.error("[百度] loadResource 异常:", e.message || e);
      return [{ name: info.title || "百度网盘", description: "直链解析异常：" + (e.message || e), url: "" }];
    }
  }
  if (info.action !== "play" && info.action !== "baiduPlay") return [];
  const videoInfo = info.videoInfo || {};
  try {
    return [await muouQuarkSource(videoInfo, info.title)];
  } catch (e) {
    console.error("[Quark] loadResource 获取播放直链失败:", e.message || e);
  }
  return [{
    name: info.title || "夸克视频",
    description: "获取播放直链失败，请检查 Cookie",
    url: ""
  }];
}

async function getStoken(shareId, passcode) {
  const url = "https://drive-h.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc&uc_param_str=";
  const json = await httpJson("POST", url, { pwd_id: shareId, passcode: passcode || "" }, quarkHeaders());
  return json && json.status === 200 && json.data ? json.data.stoken : "";
}

async function getShareDetail(shareId, stoken) {
  const back = { movieName: "", list: [] };
  const folderQueue = ["0"];
  while (folderQueue.length > 0) {
    const pdir = folderQueue.shift();
    const params = {
      pr: "ucpro", fr: "pc", uc_param_str: "", ver: "2",
      pwd_id: shareId, stoken, pdir_fid: pdir,
      force: "0", _page: "1", _size: "200", _sort: "file_type:asc,file_name:asc"
    };
    const url = `https://drive-h.quark.cn/1/clouddrive/share/sharepage/detail?${toQuery(params)}`;
    const json = await httpJson("GET", url, null, quarkHeaders());
    const items = (json && json.data && json.data.list) || [];
    for (const item of items) {
      if (item.dir) {
        back.movieName = item.file_name || back.movieName;
        folderQueue.push(item.fid);
      } else if (String(item.file_type || "").includes("video") || item.obj_category === "video") {
        back.list.push({
          fid: item.fid,
          file_name: item.file_name,
          pdir_fid: item.pdir_fid,
          size: item.size,
          share_fid_token: item.share_fid_token || "",
          video_max_resolution: item.video_max_resolution || "",
          dir: false,
          file: true,
          shareId,
          stoken
        });
      }
    }
  }
  if (!back.movieName && back.list[0]) back.movieName = String(back.list[0].file_name || "").replace(/\.(mp4|mkv|flv|avi|mov|m3u8)$/i, "");
  return back;
}

async function getVideosFromShareLink(shareLink) {
  const match = String(shareLink || "").match(/\/s\/([a-zA-Z0-9]+)/);
  const shareId = match ? match[1] : "";
  if (!shareId) return { movieName: "", list: [] };
  const stoken = await getStoken(shareId, "");
  if (!stoken) return { movieName: "", list: [] };
  return await getShareDetail(shareId, stoken);
}

// ==================== 夸克网盘缓存文件夹管理 ====================

// 检查缓存文件夹是否存在，返回 fid
async function checkFolderExists(folderName) {
  const url = "https://drive-pc.quark.cn/1/clouddrive/file/sort?pr=ucpro&fr=pc&uc_param_str=&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,updated_at:desc&fetch_all_file=1&fetch_risk_file_name=1";
  const json = await httpJson("GET", url, null, quarkHeaders());
  const list = (json && json.data && json.data.list) || [];
  const folder = list.find(x => x.dir && x.file_name === folderName);
  return folder ? folder.fid : "";
}

// 删除文件/文件夹列表
async function deleteFiles(filelist) {
  if (!Array.isArray(filelist) || filelist.length === 0) return false;
  const url = "https://drive-pc.quark.cn/1/clouddrive/file/delete?pr=ucpro&fr=pc&uc_param_str=";
  try {
    const json = await httpJson("POST", url, { action_type: 2, filelist: filelist, exclude_fids: [] }, quarkHeaders());
    if (json && json.status === 200 && json.code === 0) {
      console.log(`[QuarkAPI] 删除成功，共删除 ${filelist.length} 个文件/文件夹`);
      return true;
    }
    console.error("[QuarkAPI] 删除失败:", json);
    return false;
  } catch (e) {
    console.error("[QuarkAPI] 删除异常:", e.message || e);
    return false;
  }
}

// 创建缓存文件夹（与 quarkapi 逻辑一致：存在则先删除再创建）
async function createFolder(folderName, pdirFid = "0") {
  // 检查是否已存在
  const existingFid = await checkFolderExists(folderName);
  if (existingFid) {
    console.log(`[QuarkAPI] 缓存文件夹已存在，删除旧文件夹: ${folderName}`);
    await deleteFiles([existingFid]);
  }
  // 创建新文件夹
  const url = "https://drive-pc.quark.cn/1/clouddrive/file?pr=ucpro&fr=pc&uc_param_str=";
  try {
    const json = await httpJson("POST", url, {
      pdir_fid: pdirFid,
      file_name: folderName,
      dir_path: "",
      dir_init_lock: false
    }, quarkHeaders());
    if (json && json.status === 200 && json.code === 0 && json.data) {
      console.log(`[QuarkAPI] 创建缓存文件夹成功: ${folderName}, fid=${json.data.fid}`);
      return json.data.fid;
    }
    console.error("[QuarkAPI] 创建文件夹失败:", json);
    return "0";
  } catch (e) {
    console.error("[QuarkAPI] 创建文件夹异常:", e.message || e);
    return "0";
  }
}

// 转存分享文件到缓存文件夹
async function saveShareFile(videoInfo) {
  const toFid = await createFolder(CACHE_FOLDER);
  if (!toFid || toFid === "0") {
    console.error("[QuarkAPI] 缓存文件夹获取失败");
    return "";
  }
  const url = "https://drive-h.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc&uc_param_str=";
  const body = {
    fid_list: [videoInfo.fid],
    fid_token_list: [videoInfo.share_fid_token],
    pdir_fid: videoInfo.pdir_fid,
    pwd_id: videoInfo.shareId,
    scene: "link",
    stoken: videoInfo.stoken,
    to_pdir_fid: toFid
  };
  try {
    const json = await httpJson("POST", url, body, quarkHeaders());
    const inner = json && json.data && json.data.task_resp && json.data.task_resp.data;
    const fids = inner && (inner.save_as && (inner.save_as.save_as_top_fids || inner.save_as.save_as_select_top_fids));
    return fids && fids.length ? fids[0] : "";
  } catch (e) {
    console.error("[QuarkAPI] 转存失败:", e.message || e);
    return "";
  }
}

// 获取播放 URL
async function getPlayUrl(myFid) {
  const url = "https://drive-pc.quark.cn/1/clouddrive/file/v2/play?pr=ucpro&fr=pc&uc_param_str=";
  const json = await httpJson("POST", url, { fid: myFid, resolutions: "normal,low,high,super,2k,4k" }, quarkHeaders());
  const arr = json && json.status === 200 && json.code === 0 && json.data ? (json.data.video_list || []) : [];
  return arr.map(v => ({ resolution: v.resolution, file_name: json.data.file_name, url: v.video_info && v.video_info.url })).filter(v => v.url);
}

function formatVideoName(fileName, size) {
  if (!fileName) return "视频";
  const gb = Number(size || 0) / 1024 / 1024 / 1024;
  const sizeText = gb > 0 ? ` ${gb >= 1 ? gb.toFixed(2) + "GB" : Math.round(gb * 1024) + "MB"}` : "";
  return String(fileName).trim() + sizeText;
}


/* ===================== 百度网盘解析模块（参考 Forward-baidu.js 重写） =====================
 * 实测要点：
 * 1) share/verify 的 surl 必须去掉开头的 "1"（ERRNO 105 vs 0）
 * 2) 取回 randsk 后必须写入 Cookie: BDCLND=... 否则 share/list 返回 9019 need verify（sekey 参数无效）
 * 3) 子目录列举必须用绝对路径 dir=/电影/xxx，参考脚本的 /sharelink{shareid}-{fsid}{path} 返回 errno 2
 * 4) dlink 需要登录态：BDUSS + uid + sha1 签名（origin=dlna 移动端通道）
 * 5) 播放必须带上 netdisk UA + Cookie，并附 header/headers/playHeaders/cookie 等宿主字段
 * =============================================================================== */

const BAIDU_API_BASE = "https://pan.baidu.com/";
const BAIDU_PC_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const BAIDU_DL_UA = "netdisk;P2SP;2.2.91.136;android-android;";
const BAIDU_UZ_DEVUID = "73CED981D0F186D12BC18CAE1684FFD5|VSRCQTF6W";
const BAIDU_CACHE_TTL_MS = 3600 * 1000;
const BAIDU_UID_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BAIDU_COOKIE_STORAGE_KEY = "forward.muou.baidu.cookie";
const BAIDU_VIDEO_EXT_RE = /\.(mp4|mkv|avi|mov|m4v|ts|m2ts|flv|wmv|webm|rmvb|mpg|mpeg|m3u8)$/i;
const BAIDU_APP_KEY = "250528";
const BAIDU_CACHE = { share: {}, uid: {}, pending: {}, list: {}, dlink: {} };
let BAIDU_COOKIE = "";
let BAIDU_LAST_ERROR = "";
const BAIDU_STEPS = [];
function baiduStep(step, detail) {
  const line = String(step) + (detail ? "：" + detail : "");
  BAIDU_STEPS.push(line);
  if (BAIDU_STEPS.length > 30) BAIDU_STEPS.shift();
  BAIDU_LAST_ERROR = line;
  console.log("[Baidu][step] " + line);
}
function baiduCookieState(params) {
  const raw = String(baiduCookie(params) || "");
  const names = raw.split(";").map(p => p.split("=")[0].trim()).filter(Boolean);
  return { hasCookie: !!raw, length: raw.length, hasBduss: /(?:^|;)s*BDUSS=/.test(raw), names: names.slice(0, 12) };
}

function baiduCookie(params = {}) {
  const incoming = String(params.baiduCookie || params.baidu_cookie || "").trim();
  if (incoming) {
    BAIDU_COOKIE = incoming;
    safeStorageSet(BAIDU_COOKIE_STORAGE_KEY, incoming);
    return incoming;
  }
  if (BAIDU_COOKIE) return BAIDU_COOKIE;
  BAIDU_COOKIE = String(safeStorageGet(BAIDU_COOKIE_STORAGE_KEY) || "").trim();
  return BAIDU_COOKIE;
}

function baiduApplyRandsk(params, randsk) {
  if (!randsk) return;
  let cookie = baiduCookie(params).replace(/BDCLND=[^;]*;?\s*/g, "").trim();
  if (cookie && !/;$/.test(cookie)) cookie += ";";
  const merged = (cookie ? cookie + " " : "") + "BDCLND=" + randsk;
  params.baiduCookie = merged;
  BAIDU_COOKIE = merged;
  safeStorageSet(BAIDU_COOKIE_STORAGE_KEY, merged);
}

function baiduQuery(data = {}) {
  return Object.keys(data || {})
    .filter(k => data[k] !== null && data[k] !== undefined && data[k] !== "")
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");
}

function baiduWebParams() {
  return { web: 1, app_id: BAIDU_APP_KEY, channel: "chunlei", clienttype: 0 };
}

function baiduCacheGet(cache, key, ttlMs) {
  const entry = cache && cache[key];
  if (!entry) return null;
  if (Date.now() - entry.time > (ttlMs || BAIDU_CACHE_TTL_MS)) { delete cache[key]; return null; }
  return entry.value;
}

function baiduCacheSet(cache, key, value) {
  cache[key] = { time: Date.now(), value: value };
  return value;
}

function baiduSleep(ms) {
  return new Promise(resolve => {
    try { setTimeout(resolve, ms || 0); } catch (e) { resolve(); }
  });
}

function baiduHeaders(params = {}) {
  return {
    "User-Agent": BAIDU_PC_UA,
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": "https://pan.baidu.com/",
    "Cookie": baiduCookie(params)
  };
}

async function baiduApi(path, data = {}, headers = null, method = "get", params = {}, retry = 2) {
  const url = /^https?:/i.test(path) ? path : BAIDU_API_BASE + String(path).replace(/^\/+/, "");
  const merged = Object.assign({}, baiduHeaders(params), headers || {});
  let resp;
  if (String(method).toLowerCase() === "post") {
    resp = await Widget.http.post(url, baiduQuery(data), { headers: merged, timeout: 30000 });
  } else {
    const query = baiduQuery(data);
    resp = await Widget.http.get(url + (query ? (url.indexOf("?") >= 0 ? "&" : "?") + query : ""), { headers: merged, timeout: 30000 });
  }
  const status = Number((resp && (resp.status || resp.statusCode || resp.code)) || 200);
  if ((status === 429 || status === 503) && retry > 0) {
    await baiduSleep(1000 * (3 - retry));
    return baiduApi(path, data, headers, method, params, retry - 1);
  }
  const body = resp && resp.data;
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch (e) { return {}; }
  }
  return body || {};
}

function baiduParseShare(url) {
  let s = String(url || "").trim();
  try { s = decodeURIComponent(s); } catch (e) { /* 保持原样 */ }
  s = s.replace(/\s+/g, "");
  const m = s.match(/pan\.baidu\.com\/(?:s\/|wap\/init\?surl=|share\/init\?surl=)([^?&#]+)/i);
  if (!m) return null;
  let shareId = String(m[1] || "").split(/[?#]/)[0];
  shareId = shareId.replace(/^1+/, "");
  if (!shareId) return null;
  let sharePwd = "";
  const pm = s.match(/(?:pwd|password|提取码|密码)[=:：]?\s*([A-Za-z0-9]{4})(?![A-Za-z0-9])/i);
  if (pm) sharePwd = pm[1];
  return { shareId: shareId, sharePwd: sharePwd };
}

/* ---------- 哈希（百度签名用） ---------- */
function baiduUtf8Bytes(text) {
  const encoded = encodeURIComponent(String(text || ""));
  const out = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded.charAt(i) === "%") {
      out.push(parseInt(encoded.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      out.push(encoded.charCodeAt(i));
    }
  }
  return out;
}

function sha1Hex(message) {
  function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
  function hex(n) {
    let s = "";
    for (let i = 7; i >= 0; i--) s += ((n >>> (i * 4)) & 0x0f).toString(16);
    return s;
  }
  const msg = baiduUtf8Bytes(message);
  const words = [];
  for (let i = 0; i < msg.length; i++) words[i >> 2] = (words[i >> 2] || 0) | (msg[i] << (24 - (i % 4) * 8));
  words[msg.length >> 2] = (words[msg.length >> 2] || 0) | (0x80 << (24 - (msg.length % 4) * 8));
  words[((((msg.length + 8) >> 6) + 1) * 16) - 2] = msg.length * 8;
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  for (let block = 0; block < words.length; block += 16) {
    const w = [];
    for (let i = 0; i < 80; i++) {
      w[i] = i < 16 ? (words[block + i] || 0) : rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const temp = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = temp;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4);
}

function sha256Hex(message) {
  function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
  function hex(n) { return ("00000000" + (n >>> 0).toString(16)).slice(-8); }
  const k = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const bytes = baiduUtf8Bytes(message);
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  for (let bi = 7; bi >= 0; bi--) bytes.push((bitLen / Math.pow(2, bi * 8)) & 255);
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for (let i = 0; i < bytes.length; i += 64) {
    const w = [];
    for (let j = 0; j < 16; j++) w[j] = ((bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3]) >>> 0;
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(7, w[j - 15]) ^ rotr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
      const s1 = rotr(17, w[j - 2]) ^ rotr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (hh + S1 + ch + k[j] + w[j]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  return h.map(hex).join("");
}

function baiduCookieDigest(params) {
  const cookie = baiduCookie(params)
    .replace(/BDCLND=[^;]*;?\s*/g, "")
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .join(";");
  return cookie ? sha256Hex(cookie).slice(0, 32) : "nocookie";
}

/* ---------- 登录态 / uid ---------- */
async function baiduGetUid(params) {
  const cookie = baiduCookie(params);
  if (!cookie) return "";
  const digest = baiduCookieDigest(params);
  const cacheKey = "uid::" + digest;
  const memoryHit = baiduCacheGet(BAIDU_CACHE.uid, cacheKey, BAIDU_UID_CACHE_TTL_MS);
  if (memoryHit) return memoryHit;
  const storageKey = "forward.muou.baidu.uid." + digest;
  const storageRaw = safeStorageGet(storageKey);
  if (storageRaw) {
    try {
      const entry = typeof storageRaw === "string" ? JSON.parse(storageRaw) : storageRaw;
      if (entry && entry.time && Date.now() - Number(entry.time) <= BAIDU_UID_CACHE_TTL_MS && entry.value) {
        baiduCacheSet(BAIDU_CACHE.uid, cacheKey, entry.value);
        return entry.value;
      }
    } catch (e) { /* 忽略 */ }
  }
  if (BAIDU_CACHE.pending[cacheKey]) return BAIDU_CACHE.pending[cacheKey];
  const pending = Widget.http.get(
    "https://mbd.baidu.com/userx/v1/info/get?appname=baiduboxapp&fields=%20%20%20%20%20%20%20%20%5B%22bg_image%22,%22member%22,%22uid%22,%22avatar%22,%20%22avatar_member%22%5D&client&clientfrom&lang=zh-cn&tpl&ttt",
    { headers: { "User-Agent": BAIDU_PC_UA, "Cookie": cookie }, timeout: 20000 }
  ).then(resp => {
    let data = {};
    try { data = typeof resp.data === "string" ? JSON.parse(resp.data) : (resp.data || {}); } catch (e) { data = {}; }
    const uid = (data && data.data && data.data.fields && data.data.fields.uid) || "";
    if (uid) {
      baiduStep("uid 获取成功", "uid=" + String(uid).slice(0, 4) + "****");
      baiduCacheSet(BAIDU_CACHE.uid, cacheKey, uid);
      safeStorageSet(storageKey, JSON.stringify({ time: Date.now(), value: uid }));
    } else {
      baiduStep("uid 获取失败", "HTTP=" + ((resp && (resp.status || resp.statusCode)) || "?") + " errno=" + (data && data.errno) + " " + (data && data.errmsg || "") + "（通常是 Cookie 未带进本次调用，或没带 BDUSS）");
      console.warn("[Baidu] 未取到 uid，请检查百度 Cookie 是否有效");
    }
    delete BAIDU_CACHE.pending[cacheKey];
    return uid;
  }, err => {
    delete BAIDU_CACHE.pending[cacheKey];
    baiduStep("uid 请求异常", (err && (err.message || err)) + "");
    console.warn("[Baidu] 取 uid 失败:", err && err.message);
    return "";
  });
  BAIDU_CACHE.pending[cacheKey] = pending;
  return pending;
}

/* ---------- 分享 token（verify -> randsk -> list） ---------- */
async function baiduShareToken(shareData, params) {
  if (!shareData || !shareData.shareId) return null;
  const cacheKey = [shareData.shareId, shareData.sharePwd || "", baiduCookieDigest(params)].join("::");
  const cached = baiduCacheGet(BAIDU_CACHE.share, cacheKey);
  if (cached) {
    baiduApplyRandsk(params, cached.randsk);
    return cached;
  }
  const surl = encodeURIComponent(shareData.shareId);
  const verify = await baiduApi(
    "share/verify?t=" + Date.now() + "&surl=" + surl + "&" + baiduQuery(baiduWebParams()),
    { pwd: shareData.sharePwd || "" },
    null, "post", params
  );
  if (verify && verify.errno !== 0) {
    baiduStep("verify 失败", "errno=" + verify.errno + " " + (verify.errmsg || "") + (verify.errno === 105 ? "（分享链接无效 / 提取码不对）" : ""));
    console.warn("[Baidu] 提取码校验失败 errno=" + verify.errno + (verify.errno === 105 ? "（分享链接无效）" : ""));
  } else {
    baiduStep("verify 通过", "有 randsk=" + !!(verify && verify.randsk));
  }
  if (verify && verify.randsk) baiduApplyRandsk(params, verify.randsk);

  const listBody = Object.assign({ shorturl: shareData.shareId, root: 1, page: 1, num: 100, dir: "/" }, baiduWebParams());
  let listData = await baiduApi("share/list", listBody, null, "get", params);
  if (listData && listData.errno === 9019 && verify && verify.randsk) {
    // Cookie 未及时生效时重试一次
    listData = await baiduApi("share/list", listBody, null, "get", params);
  }
  if (listData && listData.errno !== 0) {
    baiduStep("根目录列举失败", "errno=" + listData.errno + " " + (listData.errmsg || ""));
    console.warn("[Baidu] 分享列表失败 errno=" + listData.errno);
  } else {
    baiduStep("根目录列举成功", "share_id=" + ((listData && listData.share_id) || "") + " uk=" + ((listData && listData.uk) || "") + " 条目=" + (((listData && listData.list) || []).length));
  }
  const token = {
    list: (listData && listData.list) || [],
    uk: (listData && (listData.uk || listData.share_uk)) || "",
    shareid: (listData && listData.share_id) || (verify && verify.share_id) || "",
    randsk: (verify && verify.randsk) || ""
  };
  if (token.shareid && token.uk) baiduCacheSet(BAIDU_CACHE.share, cacheKey, token);
  return token;
}

/* ---------- 分享内视频列表（递归，绝对路径） ---------- */
async function baiduListShareVideos(shareUrl, params) {
  const shareData = baiduParseShare(shareUrl);
  if (!shareData) return [];
  const cacheKey = [shareData.shareId, shareData.sharePwd || "", baiduCookieDigest(params)].join("::");
  const cached = baiduCacheGet(BAIDU_CACHE.list, cacheKey);
  if (cached) return cached;
  const token = await baiduShareToken(shareData, params);
  if (!token || !token.shareid || !token.uk) return [];
  const videos = [];
  const seen = {};

  const collect = (item, dirPath, group) => {
    const name = String(item.server_filename || "");
    if (seen[item.fs_id]) return;
    seen[item.fs_id] = true;
    videos.push({ fid: item.fs_id, file_name: name, size: Number(item.size || 0), dir: dirPath, group: group || "" });
  };

  // 注意：百度接口必须以绝对路径列举（item.path，如 /电影/2026/Z 捉妖天师），
  // 参考脚本用的 /sharelink{shareid}-{fsid}{path} 在当前接口会返回 errno 2
  const childPath = (item, parentPath) => {
    const p = String(item.path || "").trim();
    if (p) return p;
    return String(parentPath || "/").replace(/\/+$/, "") + "/" + String(item.server_filename || "");
  };

  const handle = async (item, parentPath, group, depth) => {
    const name = String(item.server_filename || "");
    if (String(item.isdir) === "1") {
      if (!name) return;
      const p = childPath(item, parentPath);
      await walk(p, group ? group + "/" + name : name, depth + 1);
      return;
    }
    if (BAIDU_VIDEO_EXT_RE.test(name)) collect(item, parentPath, group);
  };

  const walk = async (dirPath, group, depth) => {
    if (depth > 6) return;
    const body = Object.assign({ shareid: token.shareid, uk: token.uk, sekey: token.randsk, dir: dirPath, page: 1, num: 100 }, baiduWebParams());
    const data = await baiduApi("share/list", body, null, "get", params);
    if (!data || data.errno !== 0) {
      console.warn("[Baidu] 目录列举失败 dir=" + dirPath + " errno=" + (data && data.errno));
      return;
    }
    for (const item of (data.list || [])) await handle(item, dirPath, group, depth);
  };

  for (const item of (token.list || [])) await handle(item, "/", "", 0);
  baiduCacheSet(BAIDU_CACHE.list, cacheKey, videos);
  return videos;
}

/* ---------- 取播放直链 ---------- */
async function baiduDirectPlayUrl(video, shareUrl, params) {
  const shareData = baiduParseShare(shareUrl);
  if (!shareData || !video || !video.fid) return "";
  const cacheKey = [shareData.shareId, video.fid, baiduCookieDigest(params)].join("::");
  const cached = baiduCacheGet(BAIDU_CACHE.dlink, cacheKey);
  if (cached) return cached;
  const token = await baiduShareToken(shareData, params);
  if (!token || !token.shareid || !token.uk) return "";
  const uid = await baiduGetUid(params);
  const bduss = (baiduCookie(params).match(/BDUSS=([^;]+)/) || [])[1] || "";
  const state = baiduCookieState(params);
  baiduStep("取直链前置检查", "Cookie来源=" + (params && params.baiduCookie ? "params(设置项)" : "storage") + " 长度=" + state.length + " 含BDUSS=" + state.hasBduss + " uid=" + (uid ? "有" : "无"));
  if (!uid || !bduss) {
    baiduStep("取直链中止", !bduss ? "Cookie 里没有 BDUSS" : "uid 拿不到（见上面 uid 那一步）");
    console.warn("[Baidu] 缺少 " + (!bduss ? "BDUSS" : "uid") + "，无法获取直链（请在设置中填入有效百度 Cookie）");
    return "";
  }
  const time = String(Date.now());
  const rand = sha1Hex(
    sha1Hex(bduss) + uid + "ebrcUYiuxaZv2XGu7KIYKxUrqfnOfpDF" + time + BAIDU_UZ_DEVUID +
    "11.30.2ae5821440fab5e1a61a025f014bd8972"
  );
  const body = {
    shareid: token.shareid,
    uk: token.uk,
    fid: video.fid,
    sekey: token.randsk,
    origin: "dlna",
    devuid: BAIDU_UZ_DEVUID,
    clienttype: 1,
    channel: "android_12_zhao_bd-netdisk_1024266h",
    version: "11.30.2",
    time: time,
    rand: rand
  };
  const data = await baiduApi("share/list", body, { "User-Agent": BAIDU_DL_UA }, "get", params);
  const files = (data && data.list) || [];
  const hit = files.find(f => String(f.fs_id || f.fsid || f.fid) === String(video.fid)) || files[0] || {};
  const dlink = hit.dlink || "";
  const dlHost = (String(dlink).match(/^https?:\/\/([^/]+)/) || [])[1] || "";
  baiduStep("DLNA 取直链", "HTTP errno=" + ((data && data.errno) || 0) + " " + ((data && data.errmsg) || "") + " 返回文件=" + files.length + " dlink=" + (dlink ? dlHost : "无"));
  if (data && data.errno !== 0) {
    console.warn("[Baidu] 直链获取失败 errno=" + data.errno);
  }
  if (dlink) baiduCacheSet(BAIDU_CACHE.dlink, cacheKey, dlink);
  return dlink;
}

/* ---------- 播放项组装：与木偶原版夸克一致的最小结构 { name, description, url } ---------- */
function muouSizeText(bytes) {
  const n = Number(bytes || 0);
  if (!n || !Number.isFinite(n)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length - 1) { v = v / 1024; i++; }
  return (i ? v.toFixed(2) : String(Math.round(v))) + " " + units[i];
}

async function baiduPlaySource(video, shareUrl, title, params) {
  const file = (video && video.file_name) || "";
  const name = title || file || "百度网盘";
  const sizeText = muouSizeText(video && video.size);
  const direct = await baiduDirectPlayUrl(video, shareUrl, params);
  if (!direct) {
    console.warn("[muou] 百度直链为空：检查百度 Cookie（需 BDUSS）与分享状态");
    return { name: name, description: "百度直链失败 · " + (BAIDU_LAST_ERROR || "未知原因（可运行“百度诊断”模块看细节）"), url: "" };
  }
  console.log("[muou] 百度直链就绪", { file: file, size: video && video.size });
  // 百度 dlink 必须带 netdisk UA + Referer + 登录 Cookie，否则 CDN 直接 403（详见文件头注释第 5 条）
  const playHeaders = {
    "User-Agent": BAIDU_DL_UA,
    "Referer": "https://pan.baidu.com/",
    "Cookie": baiduCookie(params)
  };
  return {
    name: name,
    description: ["百度网盘", "原画", sizeText].filter(Boolean).join(" · "),
    url: direct,
    customHeaders: Object.assign({}, playHeaders),
    headers: Object.assign({}, playHeaders),
    playerType: "system"
  };
}

/* ---------- 百度诊断：只读、不改播放行为，把每一步的 errno 摊开 ---------- */
async function loadBaiduDiagnostics(params = {}) {
  bindForwardParams(params);
  const out = [];
  const item = (title, description) => ({ id: "muou-baidu-diag-" + out.length, type: "url", title: String(title), description: String(description || "") });
  try {
    const state = baiduCookieState(params);
    out.push(item(
      "① Cookie " + (state.hasCookie ? "已读到" : "没读到") + (state.hasBduss ? " · 含 BDUSS" : " · 缺 BDUSS"),
      JSON.stringify({ 来源: params && params.baiduCookie ? "params(设置项)" : "storage", 长度: state.length, 字段: state.names })
    ));
    const shareUrl = String(params.shareUrl || "").trim() || String(safeStorageGet("forward.muou.baidu.lastShare") || "");
    if (!shareUrl) {
      out.push(item("② 缺少分享链接", "先在详情页打开一次带百度网盘的条目，或在上面填入百度分享链接后重跑"));
      return out;
    }
    const shareData = baiduParseShare(shareUrl);
    out.push(item("② 分享解析", shareData ? JSON.stringify(shareData) : "解析失败：" + shareUrl));
    if (!shareData) return out;
    BAIDU_STEPS.length = 0;
    const token = await baiduShareToken(shareData, params);
    out.push(item(
      "③ 校验+根目录 " + (token && token.shareid && token.uk ? "OK" : "失败"),
      "shareid=" + ((token && token.shareid) || "-") + " uk=" + ((token && token.uk) || "-") + " randsk=" + (token && token.randsk ? "有" : "无") + " 根条目=" + (((token && token.list) || []).length)
    ));
    const videos = await baiduListShareVideos(shareUrl, params);
    out.push(item("④ 递归视频 " + videos.length + " 个", videos.slice(0, 3).map(v => v.file_name + " (" + muouSizeText(v.size) + ")").join("\n")));
    const uid = await baiduGetUid(params);
    out.push(item("⑤ uid " + (uid ? "OK" : "失败"), uid ? String(uid).slice(0, 4) + "****" : (BAIDU_LAST_ERROR || "")));
    if (!videos.length) return out;
    const dlink = await baiduDirectPlayUrl(videos[0], shareUrl, params);
    const dlHost = (String(dlink).match(/^https?:\/\/([^/]+)/) || [])[1] || "";
    out.push(item("⑥ 直链 " + (dlink ? "OK" : "失败"), dlink ? dlHost + " 长度=" + dlink.length : (BAIDU_LAST_ERROR || "")));
    if (!dlink) return out;
    const headerSet = { "User-Agent": BAIDU_DL_UA, "Referer": "https://pan.baidu.com/", "Cookie": baiduCookie(params), "Range": "bytes=0-1023" };
    const probe = async (headers, tag) => {
      const t0 = Date.now();
      try {
        const resp = await Widget.http.get(dlink, { headers: headers, timeout: 20000 });
        return tag + "=" + (((resp && (resp.status || resp.statusCode)) || "?") + "") + "(" + (Date.now() - t0) + "ms)";
      } catch (e) {
        return tag + "=ERR(" + (e && e.message || e) + ")";
      }
    };
    const withHeaders = await probe(headerSet, "带netdisk头");
    const bare = await probe({ "Range": "bytes=0-1023" }, "裸请求");
    out.push(item("⑦ 直链读取对照", withHeaders + " ｜ " + bare));
    out.push(item("⑧ 步骤日志", BAIDU_STEPS.join("\n")));
  } catch (e) {
    out.push(item("诊断异常", (e && (e.message || e)) + ""));
  }
  return out;
}

/* ---------- 多源排序：百度优先（Forward-baidu.js 的 panPriority 规则） ---------- */
function muouPanPriority(type) {
  const order = ["百度", "夸克", "UC"];
  const idx = order.indexOf(type);
  return idx >= 0 ? idx : order.length;
}
