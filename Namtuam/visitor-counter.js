(() => {
  "use strict";

  const output = document.getElementById("visitor-count");
  const setupLink = document.getElementById("visitor-setup");
  const siteCode = document.querySelector('meta[name="goatcounter-code"]')?.content.trim();
  let totalPageViews = null;
  let counterReady = false;
  if (!siteCode || !/^[a-z0-9-]+$/i.test(siteCode)) {
    output.textContent = "ยังไม่ได้ตั้งค่า";
    setupLink.hidden = false;
    setupLink.textContent = document.documentElement.lang === "en" ? "Configure counter" : "ตั้งค่าตัวนับ";
    console.error("GoatCounter site code is missing or invalid; public visitor counting is disabled.");
    return;
  }

  if (["localhost", "127.0.0.1", "::1"].includes(location.hostname)) {
    const renderLocalStatus = () => {
      output.textContent = document.documentElement.lang === "en"
        ? "Live count appears on the published site"
        : "ยอดจริงแสดงเมื่อเผยแพร่เว็บไซต์";
      setupLink.hidden = false;
      setupLink.textContent = document.documentElement.lang === "en" ? "Configure counter" : "ตั้งค่าตัวนับ";
    };
    renderLocalStatus();
    window.addEventListener("namtuam-languagechange", renderLocalStatus);
    return;
  }

  const tracker = document.createElement("script");
  tracker.async = true;
  tracker.src = "https://gc.zgo.at/count.js";
  tracker.dataset.goatcounter = `https://${siteCode}.goatcounter.com/count`;
  tracker.onerror = () => console.error("GoatCounter tracking script failed to load.");
  document.head.append(tracker);

  function renderTotal() {
    output.textContent = counterReady
      ? totalPageViews.toLocaleString(document.documentElement.lang === "en" ? "en-US" : "th-TH")
      : "ตัวนับยังไม่พร้อมใช้งาน";
    setupLink.hidden = counterReady;
    setupLink.textContent = document.documentElement.lang === "en" ? "Configure counter" : "ตั้งค่าตัวนับ";
  }

  async function loadTotal() {
    try {
      const endpoint = `https://${siteCode}.goatcounter.com/counter/${encodeURIComponent("/")}.json`;
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`GoatCounter returned HTTP ${response.status}`);
      const data = await response.json();
      if (data.count === undefined || !Number.isFinite(Number(data.count))) {
        throw new Error("GoatCounter returned an unexpected counter response.");
      }
      totalPageViews = Number(data.count);
      counterReady = true;
      renderTotal();
    } catch (error) {
      renderTotal();
      console.error("Unable to load the public GoatCounter total.", error);
    }
  }

  loadTotal();
  window.addEventListener("namtuam-languagechange", renderTotal);
})();
