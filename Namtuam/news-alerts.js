(() => {
  "use strict";

  const REFRESH_MS = 15 * 60 * 1000;
  const MIN_MANUAL_REFRESH_MS = 5 * 1000;
  const list = document.getElementById("news-list");
  const status = document.getElementById("news-status");
  const refreshButton = document.getElementById("refresh-news");
  const notificationButton = document.getElementById("enable-news-notifications");
  const language = () => document.documentElement.lang === "en" ? "en-US" : "th-TH";
  let previousArticleIds = null;
  let currentArticles = null;
  let lastUpdatedAt = null;
  let lastRequestAt = 0;
  let requestInProgress = false;

  function formatDate(date) {
    if (!date) return document.documentElement.lang === "en" ? "Time unavailable" : "ไม่ระบุเวลา";
    return new Intl.DateTimeFormat(language(), {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(date);
  }

  function articleId(article) {
    return article.url || `${article.title}:${article.date?.toISOString() || ""}`;
  }

  function sanitizeArticleUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function relevantArticle(title, summary = "") {
    const text = `${title} ${summary}`.toLocaleLowerCase();
    return /(น้ำท่วม|น้ำป่า|น้ำหลาก|อุทกภัย|น้ำล้น|ฝนตกหนัก|เตือนภัย.*น้ำ|flood|inundation|flash flood|floodwater)/i.test(text);
  }

  async function fetchPublisherArticles() {
    const query = new URLSearchParams({ rss_url: "https://www.khaosod.co.th/feed" });
    const response = await fetch(`https://api.rss2json.com/v1/api.json?${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`RSS conversion service returned HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.status !== "ok" || !Array.isArray(payload.items)) {
      throw new Error(payload.message || "RSS conversion service returned an unexpected response.");
    }
    const articles = payload.items.map((item) => {
      const url = sanitizeArticleUrl(item.link);
      if (!url || typeof item.title !== "string") return null;
      const summary = new DOMParser().parseFromString(item.description || "", "text/html").body.textContent || "";
      if (!relevantArticle(item.title, summary)) return null;
      const date = item.pubDate ? new Date(item.pubDate) : null;
      if (!date || Number.isNaN(date.getTime()) ||
          Date.now() - date.getTime() > 7 * 24 * 60 * 60 * 1000 ||
          date.getTime() > Date.now() + 60 * 60 * 1000) return null;
      return {
        title: item.title,
        url,
        domain: "khaosod",
        date,
      };
    }).filter(Boolean);
    return { articles, source: document.documentElement.lang === "en" ? "Khaosod RSS" : "ข่าวสด RSS" };
  }

  function renderArticles(articles) {
    const fragment = document.createDocumentFragment();
    for (const article of articles) {
      const item = document.createElement("article");
      item.className = "news-item";
      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = article.title;
      const source = document.createElement("div");
      source.className = "news-item-meta";
      const publisher = article.domain === "khaosod"
        ? (document.documentElement.lang === "en" ? "Khaosod" : "ข่าวสด")
        : article.domain || (document.documentElement.lang === "en" ? "News source" : "แหล่งข่าว");
      source.textContent = `${publisher} · ${formatDate(article.date)}`;
      item.append(link, source);
      fragment.append(item);
    }
    if (!articles.length) {
      const empty = document.createElement("p");
      empty.className = "news-empty";
      empty.textContent = document.documentElement.lang === "en"
        ? "No matching flood-related articles were found in the last 7 days."
        : "ยังไม่พบข่าวภัยน้ำในช่วง 7 วันที่ค้นหา";
      fragment.append(empty);
    }
    list.replaceChildren(fragment);
  }

  async function loadNews({ manual = false } = {}) {
    if (requestInProgress || document.hidden) return;
    if (manual && Date.now() - lastRequestAt < MIN_MANUAL_REFRESH_MS) return;
    requestInProgress = true;
    lastRequestAt = Date.now();
    refreshButton.disabled = true;
    status.classList.remove("error");
    status.textContent = document.documentElement.lang === "en" ? "Checking recent news…" : "กำลังตรวจสอบข่าวล่าสุด…";
    try {
      const result = await fetchPublisherArticles();
      const articles = result.articles
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
        .slice(0, 8);
      const currentIds = new Set(articles.map(articleId));
      if (previousArticleIds && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const newArticle = articles.find((article) => !previousArticleIds.has(articleId(article)));
        if (newArticle) {
          const notification = new Notification(
            document.documentElement.lang === "en" ? "New flood-related news" : "ข่าวภัยน้ำรายการใหม่",
            { body: newArticle.title, tag: articleId(newArticle) },
          );
          notification.onclick = () => {
            window.focus();
            window.open(newArticle.url, "_blank", "noopener,noreferrer");
          };
        }
      }
      previousArticleIds = currentIds;
      currentArticles = articles;
      lastUpdatedAt = new Date();
      renderArticles(articles);
      status.textContent = `${document.documentElement.lang === "en" ? "Updated" : "อัปเดต"} ${formatDate(lastUpdatedAt)} · ${result.source}`;
    } catch (error) {
      status.textContent = document.documentElement.lang === "en"
        ? "News services are unavailable. Check the linked Google News feed."
        : "บริการข่าวไม่พร้อมใช้งาน ตรวจสอบลิงก์ Google News ด้านล่างได้";
      status.classList.add("error");
      console.error("Unable to retrieve current articles from the Thai publisher RSS feed.", error);
    } finally {
      requestInProgress = false;
      refreshButton.disabled = false;
    }
  }

  refreshButton.addEventListener("click", () => loadNews({ manual: true }));
  notificationButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      status.textContent = document.documentElement.lang === "en"
        ? "This browser does not support desktop notifications."
        : "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนบนหน้าจอ";
      status.classList.add("error");
      return;
    }
    let permission;
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      status.classList.add("error");
      status.textContent = document.documentElement.lang === "en"
        ? "Could not request notification permission."
        : "ขอสิทธิ์การแจ้งเตือนไม่สำเร็จ";
      console.error("Could not request browser notification permission.", error);
      return;
    }
    if (permission === "granted") {
      notificationButton.textContent = document.documentElement.lang === "en" ? "Alerts enabled" : "เปิดแจ้งเตือนแล้ว";
      status.classList.remove("error");
      status.textContent = document.documentElement.lang === "en"
        ? "New articles will notify you while this page is open."
        : "จะแจ้งเมื่อมีข่าวใหม่ขณะเปิดหน้าเว็บนี้อยู่";
    } else {
      status.classList.add("error");
      status.textContent = document.documentElement.lang === "en"
        ? "Notification permission was not granted."
        : "ไม่ได้รับอนุญาตการแจ้งเตือน";
    }
  });

  window.addEventListener("namtuam-languagechange", () => {
    if ("Notification" in window) {
      notificationButton.textContent = document.documentElement.lang === "en"
        ? (Notification.permission === "granted" ? "Alerts enabled" : "Enable alerts")
        : (Notification.permission === "granted" ? "เปิดแจ้งเตือนแล้ว" : "เปิดแจ้งเตือน");
    }
    if (currentArticles) {
      renderArticles(currentArticles);
      status.textContent = `${document.documentElement.lang === "en" ? "Updated" : "อัปเดต"} ${formatDate(lastUpdatedAt)} · ${document.documentElement.lang === "en" ? "Khaosod RSS" : "ข่าวสด RSS"}`;
    }
  });
  window.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastRequestAt >= REFRESH_MS) loadNews();
  });
  window.setInterval(() => loadNews(), REFRESH_MS);
  loadNews();
})();
