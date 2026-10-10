(() => {
  "use strict";

  const API_URL = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load";
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const FRESHNESS_LIMIT_MS = 24 * 60 * 60 * 1000;
  const MAX_STATIONS_IN_LIST = 120;
  const $ = (id) => document.getElementById(id);

  const elements = {
    updated: $("last-updated"),
    heroUpdated: $("hero-updated"),
    heroFloodCount: $("hero-flood-count"),
    heroSummary: $("hero-summary"),
    notice: $("notice"),
    refresh: $("refresh-button"),
    total: $("count-total"),
    flood: $("count-flood"),
    high: $("count-high"),
    alertStations: $("alert-stations"),
    notFlooded: $("count-not-flooded"),
    mapCount: $("map-count"),
    search: $("search-input"),
    province: $("province-filter"),
    status: $("status-filter"),
    list: $("station-list"),
    subtitle: $("station-subtitle"),
    footer: $("list-footer"),
    routeForm: $("route-form"),
    routeOrigin: $("route-origin"),
    routeDestination: $("route-destination"),
    routeSubmit: $("route-submit"),
    routeStatus: $("route-status"),
    routeResults: $("route-results"),
    routeSegments: $("route-segments"),
    findNearbyHelp: $("find-nearby-help"),
    resourceStatus: $("resource-status"),
    resourceResults: $("resource-results"),
  };

  let map;
  let stationLayer;
  let routeLayer;
  let resourceLayer;
  let mapResizeObserver;
  let mapResizeTimeout;
  let stations = [];
  let hasLoadedData = false;

  const currentLocale = () => document.documentElement.lang === "en" ? "en-US" : "th-TH";
  let numberFormatter = new Intl.NumberFormat(currentLocale());
  let dateFormatter = new Intl.DateTimeFormat(currentLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function stationValue(station, key) {
    return document.documentElement.lang === "en" && station[`${key}En`]
      ? station[`${key}En`]
      : station[key];
  }

  window.addEventListener("namtuam-languagechange", () => {
    numberFormatter = new Intl.NumberFormat(currentLocale());
    dateFormatter = new Intl.DateTimeFormat(currentLocale(), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    updateSummary();
    renderMap();
    renderList();
  });

  function initMap() {
    if (!window.L) {
      showNotice("โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วโหลดหน้าใหม่", true);
      return;
    }
    map = L.map("map", { scrollWheelZoom: true }).setView([15.4, 101.0], 5.4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    stationLayer = L.layerGroup().addTo(map);
    resourceLayer = L.layerGroup().addTo(map);
    const mapWrap = $("map").parentElement;
    if ("ResizeObserver" in window) {
      mapResizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      });
      mapResizeObserver.observe(mapWrap);
    } else {
      window.addEventListener("resize", () => {
        window.clearTimeout(mapResizeTimeout);
        mapResizeTimeout = window.setTimeout(() => map.invalidateSize({ pan: false }), 120);
      });
    }
    window.addEventListener("pageshow", () => map.invalidateSize({ pan: false }));
  }

    function getCurrentLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          (error) => {
            const reason = error.code === error.PERMISSION_DENIED
              ? "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง กรุณาอนุญาต Location ในเบราว์เซอร์"
              : error.code === error.POSITION_UNAVAILABLE
                ? "ไม่สามารถระบุตำแหน่งปัจจุบันได้"
                : "ระบุตำแหน่งใช้เวลานานเกินไป กรุณาลองอีกครั้ง";
            reject(new Error(reason));
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
        );
      });
    }

    function distanceMeters(first, second) {
      const toRadians = (degrees) => degrees * Math.PI / 180;
      const latitudeDelta = toRadians(second.latitude - first.latitude);
      const longitudeDelta = toRadians(second.longitude - first.longitude);
      const arc = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) *
        Math.sin(longitudeDelta / 2) ** 2;
      return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
    }

    function resourceCategory(tags) {
      if (tags.social_facility === "shelter" || tags.amenity === "shelter" ||
          tags.emergency === "assembly_point") return "ที่พักพิง";
      if (tags.amenity === "hospital" || tags.healthcare === "hospital") return "โรงพยาบาล";
      if (tags.amenity === "clinic" || tags.amenity === "doctors" ||
          tags.healthcare === "clinic" || tags.healthcare === "doctor" ||
          tags.healthcare === "health_post") return "คลินิก / อนามัย";
      return "";
    }

    function resourcePosition(element) {
      const latitude = Number(element.lat ?? element.center?.lat);
      const longitude = Number(element.lon ?? element.center?.lon);
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
    }

    function resourcePhone(tags) {
      return text(tags.phone || tags["contact:phone"] || tags["emergency:phone"]);
    }

    function renderResourcePlaces(places, userLocation) {
      const fragment = document.createDocumentFragment();
      resourceLayer.clearLayers();

      if (!places.length) {
        elements.resourceResults.textContent = "ไม่พบสถานที่ที่มีข้อมูลในรัศมี 20 กม. ลองค้นหาอีกครั้งหรือสอบถามหน่วยงานในพื้นที่";
        elements.resourceResults.classList.add("resource-empty");
        return;
      }
      elements.resourceResults.classList.remove("resource-empty");

      for (const place of places) {
        const marker = L.circleMarker([place.latitude, place.longitude], {
          radius: 9,
          color: "#fff",
          weight: 2,
          fillColor: place.category === "ที่พักพิง" ? "#7654a5" : "#d95159",
          fillOpacity: .95,
        }).addTo(resourceLayer);
        const popup = document.createElement("div");
        const popupName = document.createElement("strong");
        popupName.textContent = place.name;
        const popupCategory = document.createElement("p");
        popupCategory.textContent = place.category;
        popup.append(popupName, popupCategory);
        if (place.phone) {
          const phone = document.createElement("a");
          phone.href = `tel:${place.phone.replace(/[^\d+]/g, "")}`;
          phone.textContent = place.phone;
          popup.append(phone);
        }
        marker.bindPopup(popup);

        const card = document.createElement("article");
        card.className = "resource-place";
        const details = document.createElement("div");
        details.className = "resource-place-details";
        const title = document.createElement("strong");
        title.textContent = place.name;
        const category = document.createElement("span");
        category.className = "resource-category";
        category.textContent = place.category;
        const distance = document.createElement("span");
        distance.textContent = routeDistance(distanceMeters(userLocation, place));
        details.append(title, category, distance);

        const actions = document.createElement("div");
        actions.className = "resource-place-actions";
        if (place.phone) {
          const phone = document.createElement("a");
          phone.className = "resource-phone";
          phone.href = `tel:${place.phone.replace(/[^\d+]/g, "")}`;
          phone.textContent = `โทร ${place.phone}`;
          actions.append(phone);
        } else {
          const noPhone = document.createElement("span");
          noPhone.className = "resource-no-phone";
          noPhone.textContent = "ไม่มีเบอร์โทรในข้อมูลแผนที่";
          actions.append(noPhone);
        }
        const googleMaps = document.createElement("a");
        googleMaps.className = "resource-google-maps";
        googleMaps.href = googleMapsDirectionsUrl(
          `${userLocation.latitude},${userLocation.longitude}`,
          `${place.latitude},${place.longitude}`,
        );
        googleMaps.target = "_blank";
        googleMaps.rel = "noopener noreferrer";
        googleMaps.textContent = "เปิด Google Maps";
        actions.append(googleMaps);
        const navigate = document.createElement("button");
        navigate.className = "resource-navigate";
        navigate.type = "button";
        navigate.textContent = "นำทางจากตำแหน่งฉัน";
        navigate.addEventListener("click", () => navigateToResource(place, navigate));
        actions.append(navigate);
        card.append(details, actions);
        card.addEventListener("click", (event) => {
          if (event.target.closest("a, button")) return;
          map.setView([place.latitude, place.longitude], 15, { animate: true });
          marker.openPopup();
        });
        fragment.append(card);
      }
      elements.resourceResults.replaceChildren(fragment);
    }

    async function findNearbyHelp() {
      elements.findNearbyHelp.disabled = true;
      elements.resourceStatus.classList.remove("error");
      elements.resourceResults.replaceChildren();
      elements.resourceResults.classList.remove("resource-empty");
      elements.resourceStatus.textContent = "กำลังขอตำแหน่งและค้นหาสถานที่ใกล้เคียง…";
      let currentLocation = null;
      try {
        currentLocation = await getCurrentLocation();
        const radius = 20000;
        const query = `[out:json][timeout:25];(node(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["amenity"~"^(hospital|clinic|doctors|shelter)$"];way(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["amenity"~"^(hospital|clinic|doctors|shelter)$"];relation(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["amenity"~"^(hospital|clinic|doctors|shelter)$"];node(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["social_facility"="shelter"];way(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["social_facility"="shelter"];relation(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["social_facility"="shelter"];node(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["emergency"="assembly_point"];way(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["emergency"="assembly_point"];relation(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["emergency"="assembly_point"];node(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["healthcare"~"^(hospital|clinic|doctor|health_post)$"];way(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["healthcare"~"^(hospital|clinic|doctor|health_post)$"];relation(around:${radius},${currentLocation.latitude},${currentLocation.longitude})["healthcare"~"^(hospital|clinic|doctor|health_post)$"];);out center tags;`;
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`แหล่งข้อมูลแผนที่ตอบกลับ ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.elements)) throw new Error("รูปแบบข้อมูลสถานที่จาก OpenStreetMap ไม่ถูกต้อง");
        const places = data.elements.map((element) => {
          const tags = element.tags || {};
          const position = resourcePosition(element);
          const category = resourceCategory(tags);
          if (!position || !category) return null;
          return {
            id: element.id,
            type: element.type,
            ...position,
            category,
            name: text(tags.name || tags["name:th"] || tags["name:en"]) || category,
            phone: resourcePhone(tags),
          };
        }).filter(Boolean).sort((a, b) => distanceMeters(currentLocation, a) - distanceMeters(currentLocation, b)).slice(0, 40);
        renderResourcePlaces(places, currentLocation);
        elements.resourceStatus.textContent = document.documentElement.lang === "en"
          ? `Showing ${places.length} places within 20 km · OpenStreetMap data may be incomplete or outdated`
          : `แสดง ${places.length} แห่งในรัศมี 20 กม. · ข้อมูล OpenStreetMap อาจไม่ครบหรือเปลี่ยนแปลง`;
        L.circleMarker([currentLocation.latitude, currentLocation.longitude], {
          radius: 8, color: "#fff", weight: 2, fillColor: "#2869c5", fillOpacity: 1,
        }).bindPopup("ตำแหน่งปัจจุบัน").addTo(resourceLayer);
        if (places.length) map.fitBounds(L.latLngBounds([[currentLocation.latitude, currentLocation.longitude], ...places.slice(0, 8).map((place) => [place.latitude, place.longitude])]), { padding: [36, 36], maxZoom: 12 });
      } catch (error) {
        elements.resourceStatus.textContent = error.message || "ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง";
        elements.resourceStatus.classList.add("error");
        elements.resourceResults.replaceChildren();
        if (currentLocation) {
          const fragment = document.createDocumentFragment();
          for (const [query, label] of [
            ["emergency shelter", document.documentElement.lang === "en" ? "Search nearby shelters in Google Maps" : "ค้นหาที่พักพิงใกล้ฉันใน Google Maps"],
            ["hospital clinic", document.documentElement.lang === "en" ? "Search nearby hospitals in Google Maps" : "ค้นหาโรงพยาบาลใกล้ฉันใน Google Maps"],
          ]) {
            const link = document.createElement("a");
            const params = new URLSearchParams({
              api: "1",
              query: `${query} near ${currentLocation.latitude},${currentLocation.longitude}`,
            });
            link.className = "resource-google-maps resource-fallback-link";
            link.href = `https://www.google.com/maps/search/?${params}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = label;
            fragment.append(link);
          }
          elements.resourceResults.append(fragment);
        }
      } finally {
        elements.findNearbyHelp.disabled = false;
      }
    }

    async function navigateToResource(place, button) {
      button.disabled = true;
      elements.resourceStatus.classList.remove("error");
      elements.resourceStatus.textContent = `กำลังคำนวณเส้นทางไปยัง ${place.name}…`;
      try {
        const origin = await getCurrentLocation();
        const coordinates = `${origin.longitude},${origin.latitude};${place.longitude},${place.latitude}`;
        const params = new URLSearchParams({ overview: "full", geometries: "geojson", steps: "false" });
        const data = await fetchJson(`https://router.project-osrm.org/route/v1/driving/${coordinates}?${params}`);
        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error("ไม่พบเส้นทางขับรถในแผนที่ถึงสถานที่นี้");
        }
        routeLayer.clearLayers();
        const route = data.routes[0];
        const line = L.polyline(route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]), {
          color: "#2869c5", weight: 6, opacity: .9,
        }).addTo(routeLayer);
        L.marker([origin.latitude, origin.longitude]).bindPopup("ตำแหน่งปัจจุบัน").addTo(routeLayer);
        L.marker([place.latitude, place.longitude]).bindPopup(place.name).addTo(routeLayer);
        map.fitBounds(line.getBounds(), { padding: [36, 36], maxZoom: 14 });
        $("flood-map-section").scrollIntoView({ behavior: "smooth", block: "start" });
        elements.resourceStatus.textContent = `ระยะทางประมาณ ${routeDistance(route.distance)} · ${routeDuration(route.duration)} จากตำแหน่งที่ตรวจพบ · ตรวจสอบสภาพถนนจริงก่อนเดินทาง`;
      } catch (error) {
        elements.resourceStatus.textContent = error.message || "คำนวณเส้นทางไม่สำเร็จ กรุณาลองอีกครั้ง";
        elements.resourceStatus.classList.add("error");
      } finally {
        button.disabled = false;
      }
    }
  function parseThaiWaterDate(value) {
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second = "0"] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeStations(payload) {
    const records = payload && payload.waterlevel_data && payload.waterlevel_data.data;
    if (!Array.isArray(records)) throw new Error("รูปแบบข้อมูลสถานีจาก ThaiWater ไม่ตรงตามที่คาดไว้");

    const byStation = new Map();
    for (const record of records) {
      const station = record && record.station;
      const latitude = Number(station && station.tele_station_lat);
      const longitude = Number(station && station.tele_station_long);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          latitude < 5 || latitude > 21 || longitude < 97 || longitude > 106) continue;

      const observationDate = parseThaiWaterDate(record.waterlevel_datetime);
      const stationId = station.id ?? record.id;
      const normalized = {
        id: String(stationId),
        name: text(station.tele_station_name && (station.tele_station_name.th || station.tele_station_name.en)) || "ไม่ระบุชื่อสถานี",
        nameEn: text(station.tele_station_name && (station.tele_station_name.en || station.tele_station_name.th)) || "Station name unavailable",
        province: text(record.geocode && record.geocode.province_name && (record.geocode.province_name.th || record.geocode.province_name.en)) || "ไม่ระบุจังหวัด",
        provinceEn: text(record.geocode && record.geocode.province_name && (record.geocode.province_name.en || record.geocode.province_name.th)) || "Province unavailable",
        district: text(record.geocode && record.geocode.amphoe_name && (record.geocode.amphoe_name.th || record.geocode.amphoe_name.en)),
        districtEn: text(record.geocode && record.geocode.amphoe_name && (record.geocode.amphoe_name.en || record.geocode.amphoe_name.th)),
        latitude,
        longitude,
        situationLevel: Number.isFinite(Number(record.situation_level)) ? Number(record.situation_level) : null,
        level: finiteNumber(record.waterlevel_msl) ?? finiteNumber(record.waterlevel_m),
        differenceFromBank: finiteNumber(record.diff_wl_bank),
        differenceLabel: text(record.diff_wl_bank_text),
        observedAt: observationDate,
        agency: text(record.agency && record.agency.agency_name && (record.agency.agency_name.th || record.agency.agency_name.en)),
        agencyEn: text(record.agency && record.agency.agency_name && (record.agency.agency_name.en || record.agency.agency_name.th)),
      };

      const existing = byStation.get(normalized.id);
      if (!existing || (normalized.observedAt && (!existing.observedAt || normalized.observedAt > existing.observedAt))) {
        byStation.set(normalized.id, normalized);
      }
    }
    return [...byStation.values()];
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function getStatus(station, now = Date.now()) {
    if (!station.observedAt || now - station.observedAt.getTime() > FRESHNESS_LIMIT_MS ||
        station.observedAt.getTime() > now + 60 * 60 * 1000) return "unknown";
    if (station.situationLevel === 5 || station.differenceLabel.includes("ล้นตลิ่ง")) return "flood";
    if (station.situationLevel === 4) return "high";
    if (station.situationLevel >= 1 && station.situationLevel <= 3) return "normal";
    return "unknown";
  }

  function statusLabel(status) {
    const labels = document.documentElement.lang === "en" ? {
      flood: "Overflow",
      high: "High water",
      normal: "No overflow reported",
      unknown: "Stale / unknown data",
    } : {
      flood: "น้ำล้นตลิ่ง",
      high: "น้ำมาก",
      normal: "ไม่พบรายงานล้นตลิ่ง",
      unknown: "ข้อมูลเก่า / ไม่ระบุ",
    };
    return labels[status];
  }

  function formatDate(date) {
    if (!date) return document.documentElement.lang === "en" ? "Time unavailable" : "ไม่ระบุเวลา";
    return dateFormatter.format(date) + (document.documentElement.lang === "en" ? "" : " น.");
  }

  function relativeAge(date, now = Date.now()) {
    if (!date) return document.documentElement.lang === "en" ? "Reading time unavailable" : "ไม่ระบุเวลาอ่านค่า";
    const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));
    if (minutes < 60) return document.documentElement.lang === "en"
      ? `Read ${minutes} min ago`
      : `อ่านค่าเมื่อ ${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return document.documentElement.lang === "en"
      ? `Read ${hours} hr ago`
      : `อ่านค่าเมื่อ ${hours} ชั่วโมงที่แล้ว`;
    return document.documentElement.lang === "en" ? `Read ${formatDate(date)}` : `อ่านค่า ${formatDate(date)}`;
  }

  function showNotice(message, isError = false) {
    elements.notice.textContent = message;
    elements.notice.classList.toggle("error", isError);
    elements.notice.hidden = !message;
  }

  function stationOrder(a, b) {
    const statusOrder = { flood: 0, high: 1, normal: 2, unknown: 3 };
    const orderDifference = statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
    if (orderDifference !== 0) return orderDifference;
    return (b.observedAt?.getTime() ?? 0) - (a.observedAt?.getTime() ?? 0);
  }

  function updateSummary() {
    const now = Date.now();
    const fresh = stations.filter((station) => getStatus(station, now) !== "unknown");
    const counts = { flood: 0, high: 0, normal: 0 };
    for (const station of fresh) counts[getStatus(station, now)] += 1;

    elements.total.textContent = numberFormatter.format(fresh.length);
    elements.flood.textContent = numberFormatter.format(counts.flood);
    elements.high.textContent = numberFormatter.format(counts.high);
    elements.notFlooded.textContent = numberFormatter.format(counts.normal);
    renderAlertStations(now);

    const latest = stations.reduce((date, station) =>
      station.observedAt && (!date || station.observedAt > date) ? station.observedAt : date, null);
    const latestText = latest
      ? formatDate(latest)
      : (document.documentElement.lang === "en" ? "Reading time unavailable" : "ไม่มีข้อมูลเวลาอ่านค่า");
    elements.updated.textContent = latestText;
    elements.heroUpdated.textContent = document.documentElement.lang === "en"
      ? `Latest station data ${latestText}`
      : `ข้อมูลสถานีล่าสุด ${latestText}`;
    elements.heroFloodCount.textContent = numberFormatter.format(counts.flood);
    elements.heroSummary.textContent = document.documentElement.lang === "en"
      ? `${numberFormatter.format(counts.high)} stations report high water · ${numberFormatter.format(fresh.length)} have data in the last 24 hours`
      : `${numberFormatter.format(counts.high)} สถานีรายงานระดับน้ำมาก · ${numberFormatter.format(fresh.length)} สถานีมีข้อมูลภายใน 24 ชั่วโมง`;
  }

  function renderAlertStations(now = Date.now()) {
    const activeAlerts = stations
      .filter((station) => getStatus(station, now) === "flood")
      .sort((a, b) => (b.observedAt?.getTime() ?? 0) - (a.observedAt?.getTime() ?? 0))
      .slice(0, 5);
    const fragment = document.createDocumentFragment();

    if (!activeAlerts.length) {
      const empty = document.createElement("p");
      empty.className = "alert-empty";
      empty.textContent = document.documentElement.lang === "en"
        ? (stations.length ? "No stations report overflow in the latest data." : "Station data is not available yet.")
        : (stations.length ? "ไม่พบสถานีที่รายงานน้ำล้นตลิ่งในข้อมูลล่าสุด" : "ยังไม่ได้รับข้อมูลสถานี");
      fragment.append(empty);
    }

    for (const station of activeAlerts) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "alert-station";
      const marker = document.createElement("span");
      marker.className = "alert-station-dot";
      marker.setAttribute("aria-hidden", "true");
      const details = document.createElement("span");
      details.className = "alert-station-details";
      const name = document.createElement("strong");
      name.textContent = stationValue(station, "name");
      const location = document.createElement("small");
      location.textContent = `${stationValue(station, "province")}${station.district ? ` · ${stationValue(station, "district")}` : ""}`;
      details.append(name, location);
      const arrow = document.createElement("span");
      arrow.className = "alert-station-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "›";
      button.append(marker, details, arrow);
      button.setAttribute("aria-label", document.documentElement.lang === "en"
        ? `Show ${stationValue(station, "name")}, ${stationValue(station, "province")} on the map`
        : `แสดง${stationValue(station, "name")} จังหวัด${stationValue(station, "province")}บนแผนที่`);
      button.addEventListener("click", () => focusStation(station));
      fragment.append(button);
    }

    elements.alertStations.replaceChildren(fragment);
  }

  function fillProvinceFilter() {
    const selected = elements.province.value;
    const provinces = [...new Set(stations.map((station) => station.province))].sort((a, b) => a.localeCompare(b, "th"));
    elements.province.replaceChildren(new Option("ทุกจังหวัด", ""));
    for (const province of provinces) {
      const match = stations.find((station) => station.province === province);
      elements.province.add(new Option(match ? stationValue(match, "province") : province, province));
    }
    elements.province.value = provinces.includes(selected) ? selected : "";
  }

  function filteredStations() {
    const query = elements.search.value.trim().toLocaleLowerCase("th");
    const province = elements.province.value;
    const status = elements.status.value;
    return stations.filter((station) => {
      if (province && station.province !== province) return false;
      if (status !== "all" && getStatus(station) !== status) return false;
      if (query && !`${station.name} ${station.nameEn} ${station.province} ${station.provinceEn} ${station.district} ${station.districtEn}`.toLocaleLowerCase(currentLocale()).includes(query)) return false;
      return true;
    }).sort(stationOrder);
  }

  function readingText(station) {
    const english = document.documentElement.lang === "en";
    const level = station.level === null
      ? (english ? "No water-level reading" : "ไม่มีค่าระดับน้ำ")
      : `${station.level.toFixed(2)} ${english ? "m" : "ม."}`;
    if (station.differenceFromBank !== null && station.differenceLabel) {
      return `${level} · ${station.differenceFromBank.toFixed(2)} ม. ${station.differenceLabel.replace(/\s*\(ม\.\)\s*$/, "")}`;
    }
    return level;
  }

  function popupContent(station, status) {
    const wrapper = document.createElement("div");
    wrapper.className = "water-popup";
    const title = document.createElement("h3");
    title.textContent = stationValue(station, "name");
    const badge = document.createElement("span");
    badge.className = `popup-status ${status}`;
    badge.textContent = statusLabel(status);
    wrapper.append(title, badge);

    const details = [
      `${document.documentElement.lang === "en" ? "Province " : "จังหวัด"}${stationValue(station, "province")}${station.district ? ` · ${document.documentElement.lang === "en" ? "District " : "อำเภอ"}${stationValue(station, "district")}` : ""}`,
      `ระดับน้ำ ${readingText(station)}`,
      `เวลาอ่านค่า ${formatDate(station.observedAt)}`,
      station.agency ? `${document.documentElement.lang === "en" ? "Agency " : "หน่วยงาน "}${stationValue(station, "agency")}` : "",
    ].filter(Boolean);
    for (const detail of details) {
      const paragraph = document.createElement("p");
      paragraph.textContent = detail;
      wrapper.append(paragraph);
    }
    return wrapper;
  }

  function renderMap() {
    if (!stationLayer) return;
    stationLayer.clearLayers();
    const now = Date.now();
    for (const station of filteredStations()) {
      const status = getStatus(station, now);
      const color = { flood: "#d95159", high: "#d88b2f", normal: "#148a83", unknown: "#9aa8ab" }[status];
      L.circleMarker([station.latitude, station.longitude], {
        radius: status === "flood" ? 7 : 6,
        color: "#ffffff",
        weight: 1.5,
        fillColor: color,
        fillOpacity: .92,
      }).bindPopup(popupContent(station, status)).addTo(stationLayer);
    }
  }

  function renderList() {
    const matched = filteredStations();
    const shown = matched.slice(0, MAX_STATIONS_IN_LIST);
    const fragment = document.createDocumentFragment();

    if (!shown.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = stations.length ? "ไม่พบสถานีที่ตรงกับตัวกรอง" : "ยังไม่มีข้อมูลสถานีให้แสดง";
      fragment.append(empty);
    }

    const now = Date.now();
    for (const station of shown) {
      const status = getStatus(station, now);
      const button = document.createElement("button");
      button.className = "station-row";
      button.type = "button";
      button.setAttribute("aria-label", `${stationValue(station, "name")}, ${stationValue(station, "province")}, ${statusLabel(status)}`);

      const pin = document.createElement("span");
      pin.className = `status-pin ${status}`;
      pin.setAttribute("aria-hidden", "true");
      const main = document.createElement("span");
      main.className = "station-main";
      const name = document.createElement("span");
      name.className = "station-name";
      name.textContent = stationValue(station, "name");
      const location = document.createElement("span");
      location.className = "station-location";
      location.textContent = `${stationValue(station, "province")}${station.district ? ` · ${stationValue(station, "district")}` : ""}`;
      const level = document.createElement("span");
      level.className = "station-level";
      const reading = document.createElement("span");
      reading.className = "station-reading";
      reading.textContent = readingText(station);
      const tag = document.createElement("span");
      tag.className = `status-tag ${status}`;
      tag.textContent = statusLabel(status);
      const age = document.createElement("span");
      age.className = "station-age";
      age.textContent = relativeAge(station.observedAt, now);
      level.append(reading, tag);
      main.append(name, location, level, age);
      button.append(pin, main);
      button.addEventListener("click", () => focusStation(station));
      fragment.append(button);
    }

    elements.list.replaceChildren(fragment);
    elements.subtitle.textContent = document.documentElement.lang === "en"
      ? `${numberFormatter.format(matched.length)} stations matching filters`
      : `${numberFormatter.format(matched.length)} สถานีตามตัวกรอง`;
    elements.mapCount.textContent = document.documentElement.lang === "en"
      ? `${numberFormatter.format(matched.length)} stations shown`
      : `แสดง ${numberFormatter.format(matched.length)} สถานี`;
    elements.footer.textContent = matched.length > MAX_STATIONS_IN_LIST
      ? (document.documentElement.lang === "en"
        ? `Showing ${numberFormatter.format(MAX_STATIONS_IN_LIST)} of ${numberFormatter.format(matched.length)} stations · use filters to narrow results`
        : `แสดง ${numberFormatter.format(MAX_STATIONS_IN_LIST)} จาก ${numberFormatter.format(matched.length)} สถานี · ใช้ตัวกรองเพื่อจำกัดผลลัพธ์`)
      : (document.documentElement.lang === "en"
        ? `${numberFormatter.format(matched.length)} stations`
        : `${numberFormatter.format(matched.length)} สถานี`);
  }

  function focusStation(station) {
    if (!map) return;
    $("flood-map-section").scrollIntoView({ behavior: "smooth", block: "start" });
    map.setView([station.latitude, station.longitude], Math.max(map.getZoom(), 10), { animate: true });
    const status = getStatus(station);
    stationLayer.eachLayer((marker) => {
      const position = marker.getLatLng();
      if (position.lat === station.latitude && position.lng === station.longitude) marker.openPopup();
    });
    if (status === "unknown") showNotice(document.documentElement.lang === "en"
      ? "This station has no reading within 24 hours or no reported status. The displayed value is the latest available."
      : "สถานีนี้ไม่มีข้อมูลภายใน 24 ชั่วโมง หรือไม่ระบุระดับสถานการณ์ ค่าที่แสดงเป็นข้อมูลล่าสุดที่ได้รับ", false);
  }

  async function fetchJson(url, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`บริการแผนที่ตอบกลับด้วยสถานะ ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") throw new Error("หมดเวลารอข้อมูลเส้นทาง กรุณาลองใหม่อีกครั้ง");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function geocodePlace(place) {
    const query = new URLSearchParams({ q: `${place}, Thailand`, limit: "5", lang: "en" });
    const result = await fetchJson(`https://photon.komoot.io/api/?${query}`);
    const features = Array.isArray(result.features) ? result.features : [];
    const feature = features.find((item) => {
      const countryCode = text(item.properties && item.properties.countrycode).toLowerCase();
      const country = text(item.properties && item.properties.country).toLowerCase();
      return countryCode === "th" || country === "thailand";
    });
    if (!feature || !Array.isArray(feature.geometry && feature.geometry.coordinates)) {
      throw new Error(`ไม่พบ "${place}" ในประเทศไทย ลองระบุชื่ออำเภอหรือจังหวัดเพิ่มเติม`);
    }
    const [longitude, latitude] = feature.geometry.coordinates;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error(`ไม่สามารถระบุตำแหน่งของ "${place}" ได้`);
    }
    return {
      latitude,
      longitude,
      label: [feature.properties.name, feature.properties.city, feature.properties.state]
        .filter((value, index, values) => text(value) && values.indexOf(value) === index)
        .join(", ") || place,
    };
  }

  function distanceToRouteMeters(point, coordinates) {
    const latitudeScale = 110540;
    const longitudeScale = 111320 * Math.cos(point.latitude * Math.PI / 180);
    let closest = Infinity;
    for (let index = 1; index < coordinates.length; index += 1) {
      const previous = coordinates[index - 1];
      const current = coordinates[index];
      const ax = (previous[0] - point.longitude) * longitudeScale;
      const ay = (previous[1] - point.latitude) * latitudeScale;
      const bx = (current[0] - point.longitude) * longitudeScale;
      const by = (current[1] - point.latitude) * latitudeScale;
      const dx = bx - ax;
      const dy = by - ay;
      const segmentLengthSquared = dx * dx + dy * dy;
      const fraction = segmentLengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / segmentLengthSquared));
      closest = Math.min(closest, Math.hypot(ax + fraction * dx, ay + fraction * dy));
    }
    return closest;
  }

  function nearbyRiskStations(coordinates, maximumDistance = 1000) {
    return stations
      .filter((station) => ["flood", "high"].includes(getStatus(station)))
      .map((station) => ({ station, distance: distanceToRouteMeters(station, coordinates) }))
      .filter((item) => item.distance <= maximumDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }

  function routeDistance(distance) {
    const locale = currentLocale();
    return distance >= 1000
      ? `${(distance / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })} ${locale === "en-US" ? "km" : "กม."}`
      : `${Math.round(distance).toLocaleString(locale)} ${locale === "en-US" ? "m" : "ม."}`;
  }

  function routeDuration(seconds) {
    const totalMinutes = Math.max(1, Math.round(seconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return document.documentElement.lang === "en"
      ? (hours ? `${hours} hr ${minutes} min` : `${minutes} min`)
      : (hours ? `${hours} ชม. ${minutes} นาที` : `${minutes} นาที`);
  }

  function setRouteStatus(message, isError = false) {
    elements.routeStatus.textContent = message;
    elements.routeStatus.classList.toggle("error", isError);
    elements.routeStatus.hidden = !message;
  }

  function showRouteOnMap(route, origin, destination) {
    if (!map || !routeLayer) return;
    routeLayer.clearLayers();
    const bounds = L.latLngBounds([]);
    const roads = groupedRoadSegments(route);
    if (roads.length) {
      for (const road of roads) {
        const nearby = nearbyRiskStations(road.coordinates, 1000);
        const color = nearby.some(({ station }) => getStatus(station) === "flood")
          ? "#d95159"
          : nearby.length ? "#d88b2f" : "#2869c5";
        const line = L.polyline(road.coordinates.map(([longitude, latitude]) => [latitude, longitude]), {
          color,
          weight: 5,
          opacity: .92,
        }).addTo(routeLayer);
        bounds.extend(line.getBounds());
      }
    } else {
      const line = L.polyline(route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]), {
        color: "#2869c5",
        weight: 5,
        opacity: .9,
      }).addTo(routeLayer);
      bounds.extend(line.getBounds());
    }
    const endpointIcon = (label, tone) => L.divIcon({
      className: "route-endpoint-wrap",
      html: `<span class="route-endpoint ${tone}">${label}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const endpointPopup = (label) => {
      const content = document.createElement("div");
      content.textContent = label;
      return content;
    };
    L.marker([origin.latitude, origin.longitude], { icon: endpointIcon("A", "origin-pin"), keyboard: true })
      .bindPopup(endpointPopup(`ต้นทาง: ${origin.label}`)).addTo(routeLayer);
    L.marker([destination.latitude, destination.longitude], { icon: endpointIcon("B", "destination-pin"), keyboard: true })
      .bindPopup(endpointPopup(`ปลายทาง: ${destination.label}`)).addTo(routeLayer);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }

  function routeSteps(route) {
    return (route.legs || []).flatMap((leg) => leg.steps || []).filter((step) =>
      step.geometry && Array.isArray(step.geometry.coordinates) && step.geometry.coordinates.length > 1);
  }

  function groupedRoadSegments(route) {
    const groups = [];
    for (const step of routeSteps(route)) {
      const name = text(step.name) || "ถนนที่ไม่มีชื่อในแผนที่";
      const last = groups[groups.length - 1];
      if (last && last.name === name) {
        last.distance += finiteNumber(step.distance) || 0;
        last.coordinates.push(...step.geometry.coordinates);
      } else {
        groups.push({
          name,
          distance: finiteNumber(step.distance) || 0,
          coordinates: [...step.geometry.coordinates],
        });
      }
    }
    return groups;
  }

  function renderRoadSegments(route) {
    const fragment = document.createDocumentFragment();
    const heading = document.createElement("h3");
    heading.textContent = "ตรวจดูช่วงถนนในเส้นทาง";
    const intro = document.createElement("p");
    intro.className = "route-segments-intro";
    intro.textContent = "ข้อมูลสถานีระดับน้ำใกล้ถนนเป็นเพียงสัญญาณให้ตรวจสอบ ไม่ได้ยืนยันว่าถนนท่วมหรือปิด";
    fragment.append(heading, intro);

    const roads = groupedRoadSegments(route);
    if (!roads.length) {
      const unavailable = document.createElement("p");
      unavailable.className = "route-segments-empty";
      unavailable.textContent = "ผู้ให้บริการเส้นทางไม่คืนรายละเอียดรายถนนสำหรับเส้นทางนี้";
      fragment.append(unavailable);
      elements.routeSegments.replaceChildren(fragment);
      elements.routeSegments.hidden = false;
      return;
    }

    for (const road of roads) {
      const nearby = nearbyRiskStations(road.coordinates, 1000);
      const hasFlood = nearby.some(({ station }) => getStatus(station) === "flood");
      const status = !hasLoadedData ? "unknown" : hasFlood ? "check" : "mapped";
      const row = document.createElement("div");
      row.className = `route-segment ${status}`;
      const marker = document.createElement("span");
      marker.className = `route-segment-marker ${status}`;
      marker.setAttribute("aria-hidden", "true");
      const description = document.createElement("span");
      description.className = "route-segment-description";
      const roadName = document.createElement("strong");
      roadName.textContent = road.name;
      const roadDistance = document.createElement("small");
      roadDistance.textContent = routeDistance(road.distance);
      const roadStatus = document.createElement("span");
      roadStatus.className = "route-segment-status";
      roadStatus.textContent = !hasLoadedData
        ? "ไม่มีข้อมูลสถานีล่าสุดสำหรับเทียบ"
        : hasFlood
          ? `พบสถานีน้ำล้นตลิ่งใกล้แนวถนน ${nearby.filter(({ station }) => getStatus(station) === "flood").length} จุด · ตรวจสอบก่อนผ่าน`
          : nearby.length
            ? `พบสถานีน้ำมากใกล้แนวถนน ${nearby.length} จุด · ตรวจสอบก่อนผ่าน`
            : "มีเส้นทางในแผนที่ · สภาพถนนจริงยังไม่ยืนยัน";
      description.append(roadName, roadDistance, roadStatus);
      row.append(marker, description);
      fragment.append(row);
    }
    elements.routeSegments.replaceChildren(fragment);
    elements.routeSegments.hidden = false;
  }

  function renderRouteOptions(routes, origin, destination) {
    const fragment = document.createDocumentFragment();
    routes.forEach((route, index) => {
      const nearby = nearbyRiskStations(route.geometry.coordinates);
      const option = document.createElement("button");
      option.type = "button";
      option.className = "route-option";
      option.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      const title = document.createElement("strong");
      title.textContent = `เส้นทาง ${index + 1}${index === 0 ? " · แนะนำตามระยะทาง" : ""}`;
      const metrics = document.createElement("span");
      metrics.textContent = `${routeDistance(route.distance)} · เวลาประมาณ ${routeDuration(route.duration)}`;
      const caution = document.createElement("span");
      caution.className = !hasLoadedData || nearby.some(({ station }) => getStatus(station) === "flood")
        ? "route-risk"
        : nearby.length ? "route-check" : "route-clear";
      caution.textContent = !hasLoadedData
        ? "ยังไม่มีข้อมูลสถานีเพียงพอสำหรับตรวจแนวเส้นทาง"
        : nearby.length
          ? `พบสถานีระดับน้ำเสี่ยงใกล้แนวเส้นทาง ${nearby.length} จุด (ใกล้สุด ${routeDistance(nearby[0].distance)})`
          : "ไม่พบสถานีระดับน้ำเสี่ยงภายใน 1 กม. · สภาพถนนยังไม่ยืนยัน";
      option.append(title, metrics, caution);
      option.addEventListener("click", () => {
        for (const item of elements.routeResults.querySelectorAll(".route-option")) {
          item.setAttribute("aria-pressed", item === option ? "true" : "false");
        }
        showRouteOnMap(route, origin, destination);
        renderRoadSegments(route);
      });
      fragment.append(option);
    });
    const mapLink = document.createElement("a");
    mapLink.className = "route-map-link";
    mapLink.href = "#overview";
    mapLink.textContent = "ดูเส้นทางที่เลือกบนแผนที่ ↑";
    fragment.append(mapLink);
    elements.routeResults.replaceChildren(fragment);
    elements.routeResults.hidden = false;
    renderGoogleMapsShortcut(origin.label, destination.label);
    showRouteOnMap(routes[0], origin, destination);
    renderRoadSegments(routes[0]);
  }

  function googleMapsDirectionsUrl(origin, destination) {
    const params = new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode: "driving",
    });
    return `https://www.google.com/maps/dir/?${params}`;
  }

  function renderGoogleMapsShortcut(origin, destination) {
    const link = document.createElement("a");
    link.className = "route-map-link google-maps-route-link";
    link.href = googleMapsDirectionsUrl(origin, destination);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "เปิดเส้นทางใน Google Maps ↗";
    elements.routeResults.append(link);
  }

  async function findRoutes(event) {
    event.preventDefault();
    const originText = elements.routeOrigin.value.trim();
    const destinationText = elements.routeDestination.value.trim();
    if (!originText || !destinationText) {
      setRouteStatus("กรุณาระบุต้นทางและปลายทาง", true);
      return;
    }
    elements.routeSubmit.disabled = true;
    elements.routeSubmit.textContent = "กำลังค้นหา…";
    elements.routeResults.hidden = true;
    elements.routeSegments.hidden = true;
    routeLayer.clearLayers();
    setRouteStatus("กำลังค้นหาสถานที่และคำนวณเส้นทางขับรถ…");
    try {
      const [origin, destination] = await Promise.all([
        geocodePlace(originText),
        geocodePlace(destinationText),
      ]);
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const params = new URLSearchParams({ alternatives: "true", steps: "true", overview: "full", geometries: "geojson" });
      const routeData = await fetchJson(`https://router.project-osrm.org/route/v1/driving/${coordinates}?${params}`);
      if (routeData.code !== "Ok" || !Array.isArray(routeData.routes) || routeData.routes.length === 0) {
        throw new Error("ไม่พบเส้นทางที่คำนวณได้ในโครงข่ายแผนที่ ลองระบุจุดที่ใกล้ถนนหรือระบุชื่อให้ชัดขึ้น (ไม่ได้ยืนยันว่าถนนปิด)");
      }
      renderRouteOptions(routeData.routes, origin, destination);
      setRouteStatus(`พบ ${routeData.routes.length} เส้นทางในโครงข่ายแผนที่จาก ${origin.label} ไป ${destination.label} · ระยะและเวลาเป็นค่าประมาณ · ยังยืนยันสภาพถนนจริงไม่ได้`);
    } catch (error) {
      setRouteStatus(error.message || "ค้นหาเส้นทางไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", true);
    } finally {
      elements.routeSubmit.disabled = false;
      elements.routeSubmit.innerHTML = '<span aria-hidden="true">⌕</span> ค้นหาเส้นทาง';
    }

  }

  async function loadData() {
    elements.refresh.disabled = true;
    elements.refresh.textContent = "กำลังโหลด";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      let response;
      try {
        response = await fetch(API_URL, { signal: controller.signal, cache: "no-store" });
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) throw new Error(`ThaiWater ตอบกลับด้วยสถานะ ${response.status}`);
      const payload = await response.json();
      const nextStations = normalizeStations(payload);
      if (!nextStations.length) throw new Error("ไม่พบสถานีที่มีพิกัดในข้อมูลจาก ThaiWater");
      stations = nextStations;
      hasLoadedData = true;
      fillProvinceFilter();
      updateSummary();
      renderMap();
      renderList();
      showNotice("");
    } catch (error) {
      const detail = error.name === "AbortError" ? "หมดเวลารอข้อมูล" : error.message;
      if (hasLoadedData) {
        showNotice(`อัปเดตข้อมูลไม่สำเร็จ (${detail}) ข้อมูลที่แสดงเป็นข้อมูลครั้งก่อน โปรดลองรีเฟรชอีกครั้ง`, true);
      } else {
        showNotice(`เชื่อมต่อข้อมูลสถานีไม่สำเร็จ (${detail}) โปรดลองอีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต`, true);
        elements.list.replaceChildren(Object.assign(document.createElement("div"), {
          className: "list-placeholder",
          textContent: "โหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรชเพื่อลองอีกครั้ง",
        }));
      }
    } finally {
      elements.refresh.disabled = false;
      elements.refresh.textContent = "รีเฟรช";
    }
  }

  function start() {
    initMap();
    elements.refresh.addEventListener("click", loadData);
    $("map-reset").addEventListener("click", () => map?.setView([15.4, 101.0], 5.4, { animate: true }));
    elements.routeForm.addEventListener("submit", findRoutes);
    elements.findNearbyHelp.addEventListener("click", findNearbyHelp);
    elements.search.addEventListener("input", () => { renderMap(); renderList(); });
    elements.province.addEventListener("change", () => { renderMap(); renderList(); });
    elements.status.addEventListener("change", () => { renderMap(); renderList(); });
    loadData();
    window.setInterval(() => {
      if (!document.hidden && hasLoadedData) {
        updateSummary();
        renderMap();
        renderList();
      }
    }, 60 * 1000);
    window.setInterval(() => {
      if (!document.hidden) loadData();
    }, REFRESH_INTERVAL_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
