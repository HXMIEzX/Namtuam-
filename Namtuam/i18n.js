(() => {
  "use strict";

  const translations = {
    "เฝ้าระวังน้ำไทย": "Thailand Flood Watch",
    "NamTuam นํ้าท่วม — แผนที่และวางแผนการเดินทาง": "NamTuam Flood Watch — Map and Route Planner",
    "ภาพรวม": "Overview",
    "แผนที่น้ำ": "Flood map",
    "วางแผนเส้นทาง": "Plan a route",
    "สถานีตรวจวัด": "Monitoring stations",
    "ข้อมูลสถานีตรวจวัดจริง": "Live station data",
    "ข้อมูลสถานีล่าสุด": "Latest station data",
    "เข้าสู่ระบบด้วย Google": "Sign in with Google",
    "ออกจากระบบ": "Sign out",
    "THAILAND FLOOD WATCH · ข้อมูลจริงจากสถานี": "THAILAND FLOOD WATCH · LIVE STATION DATA",
    "รู้สถานการณ์น้ำ": "Know the water situation",
    "ก่อนออกเดินทาง": "Before you travel",
    "ดูจุดตรวจวัดที่รายงานน้ำล้นตลิ่งทั่วประเทศไทย เช็กข้อมูลระดับน้ำ และวางแผนเส้นทางเบื้องต้นได้ในหน้าเดียว": "Check reported river overflow stations, water levels, and plan a preliminary route in one place.",
    "กำลังโหลดสถานการณ์ล่าสุด…": "Loading the latest situation…",
    "วางแผนเส้นทาง": "Plan a route",
    "ดูสถานีเสี่ยง": "View risk stations",
    "สถานีรายงานน้ำล้นตลิ่ง": "stations reporting overflow",
    "วางแผนก่อนออกเดินทาง": "Plan before you travel",
    "ติดตามสถานการณ์": "Monitor conditions",
    "จากข้อมูลจริง": "Using real data",
    "ข้อมูลสถานีระดับน้ำทั่วประเทศ พร้อมเครื่องมือค้นหาเส้นทาง": "Water-level stations nationwide and a route search tool",
    "เปิดแผนที่เฝ้าระวัง": "Open the monitoring map",
    "น้ำ": "Water",
    "แผนที่เฝ้าระวังน้ำทั่วประเทศไทย": "Thailand flood monitoring map",
    "ดูสถานีตรวจวัด จุดรายงานน้ำล้นตลิ่ง และการแจ้งเตือนก่อนเดินทาง": "View monitoring stations, overflow reports, and travel alerts.",
    "ภาพรวมประเทศไทย": "Thailand overview",
    "การแจ้งเตือน": "Alerts",
    "รายงานจากสถานีตรวจวัดจริง": "Reports from monitoring stations",
    "ระดับน้ำมาก": "High water level",
    "จุดรายงานล่าสุด": "Latest reports",
    "ดูทั้งหมด": "View all",
    "การแจ้งเตือนเป็นรายสถานี ไม่ใช่ขอบเขตน้ำท่วม ถนนอาจมีเหตุที่ข้อมูลนี้ไม่ครอบคลุม": "Alerts apply to individual stations, not flood boundaries. Road conditions may not be covered.",
    "สายด่วนฉุกเฉิน": "Emergency hotlines",
    "แตะหมายเลขเพื่อโทรออก": "Tap a number to call",
    "แจ้งเหตุสาธารณภัย · ปภ.": "Disaster reporting · DDPM",
    "กรมป้องกันและบรรเทาสาธารณภัย": "Department of Disaster Prevention and Mitigation",
    "การแพทย์ฉุกเฉิน": "Emergency medical services",
    "สถาบันการแพทย์ฉุกเฉินแห่งชาติ": "National Institute for Emergency Medicine",
    "เหตุด่วนเหตุร้าย · ตำรวจ": "Police emergency",
    "สำนักงานตำรวจแห่งชาติ": "Royal Thai Police",
    "สอบถามเส้นทาง · กรมทางหลวง": "Road information · Department of Highways",
    "ข้อมูลทางหลวงและการเดินทาง": "Highway and travel information",
    "น้ำล้นตลิ่ง": "Overflow",
    "น้ำมาก": "High water",
    "ไม่พบรายงานล้นตลิ่ง": "No overflow reported",
    "ข้อมูลเก่า / ไม่ระบุ": "Stale / unknown data",
    "เส้นทางคำนวณได้": "Mapped route",
    "พบสถานีเสี่ยงใกล้แนวถนน": "Risk station near road",
    "หมุดคือสถานีตรวจวัด ไม่ใช่ขอบเขตน้ำท่วมทั้งจังหวัด พื้นที่ไม่มีหมุดไม่ได้ยืนยันว่าปลอดภัย": "Pins mark monitoring stations, not flood boundaries. Areas without pins are not confirmed safe.",
    "กำลังโหลดข้อมูล…": "Loading data…",
    "รีเฟรช": "Refresh",
    "สถานีมีข้อมูลล่าสุด": "Stations with recent data",
    "รายงานภายใน 24 ชั่วโมง": "Reported within 24 hours",
    "ไม่พบรายงานล้นตลิ่ง": "No overflow reported",
    "ข้อมูลจากสถานีระดับปกติหรือต่ำ": "Normal or low station readings",
    "ที่พักพิงและสถานพยาบาลใกล้ฉัน": "Nearby shelters and healthcare",
    "ค้นหาจาก OpenStreetMap เมื่ออนุญาตให้ใช้ตำแหน่งปัจจุบัน รายชื่อและเบอร์โทรอาจไม่ครบถ้วน โปรดยืนยันก่อนเดินทาง": "Search OpenStreetMap using your location. Listings and phone numbers may be incomplete; confirm before traveling.",
    "ค้นหาจากตำแหน่งปัจจุบัน": "Find places near my location",
    "ตำแหน่งของคุณจะใช้เฉพาะเพื่อค้นหาและนำทางในครั้งนี้": "Your location is used only for this search and navigation.",
    "วางแผนเส้นทางเบื้องต้น": "Plan a preliminary route",
    "ค้นหาเส้นทางขับรถระหว่างสถานที่ และตรวจดูสถานีเฝ้าระวังใกล้แนวเส้นทาง": "Find a driving route and nearby monitoring stations.",
    "ต้นทาง": "From",
    "ปลายทาง": "To",
    "เช่น อนุสาวรีย์ชัยสมรภูมิ": "e.g. Victory Monument",
    "เช่น โรงพยาบาลศิริราช": "e.g. Siriraj Hospital",
    "ค้นหาเส้นทาง": "Find route",
    "ระบบแสดงว่าเส้นทางมีอยู่ในโครงข่ายแผนที่ และเตือนสถานีระดับน้ำเสี่ยงใกล้แนวทางเท่านั้น": "Routes are calculated from mapped roads and nearby water-level stations are shown as warnings only.",
    "ยังไม่มีข้อมูลปิดถนน/ถนนน้ำท่วมแบบสดที่ใช้ยืนยันว่า “ไปได้” หรือ “ไปไม่ได้”": "No live road closure or flood data is available to confirm whether a road is passable.",
    "หลังค้นหา กด “เปิดเส้นทางใน Google Maps” เพื่อดูเส้นทางที่ Google คำนวณ": "After searching, select “Open route in Google Maps” to see Google's route.",
    "ข้อมูลจราจรกรมทางหลวง": "Department of Highways traffic updates",
    "หรือโทร 1586 ก่อนเดินทาง": "or call 1586 before traveling.",
    "ระบบแสดงว่าเส้นทางมีอยู่ในโครงข่ายแผนที่ และเตือนสถานีระดับน้ำเสี่ยงใกล้แนวทางเท่านั้น": "The route is based on mapped roads and only flags nearby water-level stations.",
    "ยังไม่มีข้อมูลปิดถนน/ถนนน้ำท่วมแบบสดที่ใช้ยืนยันว่า “ไปได้” หรือ “ไปไม่ได้”": "No live road-closure or road-flood data is available to confirm passability.",
    "ข้อมูลจราจรกรมทางหลวง": "Department of Highways traffic",
    "ตรวจสอบสถานีและรายละเอียด": "Stations and details",
    "ค้นหาจังหวัดหรือกรองสถานีตามระดับที่รายงาน": "Search a province or filter by reported level.",
    "ข้อมูลล่าสุดจากทุกภูมิภาค": "Latest data from all regions",
    "ค้นหาสถานีหรือจังหวัด": "Search stations or provinces",
    "ทุกจังหวัด": "All provinces",
    "ทุกสถานะ": "All statuses",
    "น้ำมาก (ระดับ 4)": "High water (level 4)",
    "ก่อนออกเดินทาง": "Before you go",
    "เช็กประกาศปิดถนนและสภาพเส้นทางจากหน่วยงานในพื้นที่": "Check local road closures and conditions.",
    "อย่าขับรถฝ่าน้ำไหลเชี่ยวหรือมองไม่เห็นพื้นถนน": "Never drive through fast-moving water or where the road is not visible.",
    "ติดตามประกาศเตือนภัยและเตรียมเส้นทางสำรอง": "Follow official alerts and prepare an alternate route.",
    "หากมีเหตุฉุกเฉิน โทร 1784 (ปภ.) หรือ 1669 (การแพทย์ฉุกเฉิน)": "For emergencies, call 1784 (DDPM) or 1669 (EMS).",
    "กรมป้องกันและบรรเทาสาธารณภัย": "Department of Disaster Prevention and Mitigation",
    "แหล่งข้อมูล": "Data sources",
    "เปิดเว็บไซต์ ThaiWater": "Visit ThaiWater",
    "คลังข้อมูลน้ำแห่งชาติ (ThaiWater)": "National Water Data Center (ThaiWater)",
    "ข้อมูลระดับน้ำมาจาก API สาธารณะของ ThaiWater ส่วนผลเส้นทางเป็นข้อมูลแผนที่ถนนจาก Photon/OSRM ไม่ใช่ข้อมูลปิดถนนหรือน้ำท่วมแบบเรียลไทม์ โปรดตรวจสอบประกาศทางการก่อนเดินทางเสมอ": "Water levels come from the public ThaiWater API. Routes use Photon/OSRM road maps, not live closure or flood reports. Always check official alerts before traveling.",
    "ยอดเข้าชมเว็บไซต์": "Website visits",
    "ปภ.": "DDPM",
    "สพฉ.": "NIEM",
    "ตำรวจ": "Police",
    "กรมทางหลวง": "Department of Highways",
    "ไม่มีเบอร์โทรในข้อมูลแผนที่": "No phone number listed",
    "เปิด Google Maps": "Open Google Maps",
    "แสดง": "Showing",
    "ใช้ตัวกรองเพื่อจำกัดผลลัพธ์": "use filters to narrow results",
    "ตัวนับยังไม่พร้อมใช้งาน": "Visitor counter not configured",
    "ตั้งค่าตัวนับ": "Configure counter",
    "ยอดจริงแสดงเมื่อเผยแพร่เว็บไซต์": "Live count appears on the published site",
    "ไม่พบเบอร์โทรในข้อมูลแผนที่": "No phone number listed",
    "นำทางจากตำแหน่งฉัน": "Navigate from my location",
    "โรงพยาบาล": "Hospital",
    "ที่พักพิง": "Shelter",
    "คลินิก / อนามัย": "Clinic / health center",
    "กำลังขอตำแหน่งและค้นหาสถานที่ใกล้เคียง…": "Getting your location and searching nearby…",
    "ไม่พบสถานที่ที่มีข้อมูลในรัศมี 20 กม. ลองค้นหาอีกครั้งหรือสอบถามหน่วยงานในพื้นที่": "No mapped places found within 20 km. Try again or contact local authorities.",
    "ไม่พบสถานที่ที่มีข้อมูลในรัศมี 20 กม.": "No mapped places found within 20 km.",
    "ลองค้นหาอีกครั้งหรือสอบถามหน่วยงานในพื้นที่": "Try again or contact local authorities.",
    "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง กรุณาอนุญาต Location ในเบราว์เซอร์": "Location permission was denied. Allow location access in your browser.",
    "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง": "This browser does not support geolocation.",
    "ไม่สามารถระบุตำแหน่งปัจจุบันได้": "Could not determine your current location.",
    "ระบุตำแหน่งใช้เวลานานเกินไป กรุณาลองอีกครั้ง": "Location request timed out. Please try again.",
    "ข้อมูล OpenStreetMap อาจไม่ครบหรือเปลี่ยนแปลง": "OpenStreetMap data may be incomplete or out of date.",
    "ไม่มีข้อมูลสถานีล่าสุดสำหรับเทียบ": "No recent station data available for comparison.",
    "ตรวจสอบก่อนผ่าน": "Check before traveling.",
    "สภาพถนนจริงยังไม่ยืนยัน": "Actual road conditions are unverified.",
    "สถานีระดับน้ำเสี่ยงใกล้แนวเส้นทาง": "risk water-level stations near the route",
    "ผู้ให้บริการเส้นทางไม่คืนรายละเอียดรายถนนสำหรับเส้นทางนี้": "The routing provider returned no street-by-street details for this route.",
    "ไม่มีค่าระดับน้ำ": "No water-level reading",
    "ไม่ระบุเวลา": "Time unavailable",
    "ไม่ระบุเวลาอ่านค่า": "Reading time unavailable",
    "สถานีนี้ไม่มีข้อมูลภายใน 24 ชั่วโมง หรือไม่ระบุระดับสถานการณ์ ค่าที่แสดงเป็นข้อมูลล่าสุดที่ได้รับ": "This station has no reading within 24 hours or no reported status. The displayed value is the latest available.",
    "ข่าวและเหตุเตือนภัย": "News & hazard updates",
    "ข่าวล่าสุดจากสื่อ · อัปเดตอัตโนมัติ": "Latest media reports · automatic updates",
    "รีเฟรชข่าว": "Refresh news",
    "เปิดแจ้งเตือน": "Enable alerts",
    "เปิดแจ้งเตือนแล้ว": "Alerts enabled",
    "กำลังโหลดข่าว…": "Loading news…",
    "กำลังตรวจสอบข่าวล่าสุด…": "Checking recent news…",
    "โหลดข่าวสดไม่สำเร็จ ตรวจสอบลิงก์ Google News ด้านล่างได้": "Live news could not be loaded. Check the Google News link below.",
    "ข่าวช่วยติดตามเหตุการณ์ ไม่ใช่ประกาศยืนยันการปิดถนนหรือคำเตือนภัยทางการ": "News reports help monitor events but are not official road closure or hazard alerts.",
    "ดูข่าวน้ำท่วมเพิ่มเติมใน Google News": "See more flood news on Google News",
    "อัปเดต": "Updated",
    "ข่าวสด RSS": "Khaosod RSS",
    "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนบนหน้าจอ": "This browser does not support desktop notifications.",
    "ไม่ได้รับอนุญาตการแจ้งเตือน": "Notification permission was not granted.",
    "ข่าวภัยน้ำรายการใหม่": "New flood-related news",
    "จะแจ้งเมื่อมีข่าวใหม่ขณะเปิดหน้าเว็บนี้อยู่": "New articles will notify you while this page is open.",
    "ไม่พบสถานที่ที่มีข้อมูลในรัศมี 20 กม. ลองค้นหาอีกครั้งหรือสอบถามหน่วยงานในพื้นที่": "No mapped places found within 20 km. Try again or contact local authorities.",
    "ข้อมูลสถานที่จาก OpenStreetMap อาจไม่ครบหรือเปลี่ยนแปลง": "OpenStreetMap place data may be incomplete or out of date.",
    "สถานีนี้ไม่มีข้อมูลภายใน 24 ชั่วโมง": "This station has no reading within 24 hours",
    "ไม่มีข้อมูลเวลาอ่านค่า": "Reading time unavailable",
    "รูปแบบข้อมูลสถานีจาก ThaiWater ไม่ตรงตามที่คาดไว้": "Unexpected station data format from ThaiWater.",
    "โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วโหลดหน้าใหม่": "Could not load the map. Check your internet connection and reload.",
    "การแจ้งเตือนเป็นรายสถานี ไม่ใช่ขอบเขตน้ำท่วม ถนนอาจมีเหตุที่ข้อมูลนี้ไม่ครอบคลุม": "Alerts apply to individual stations, not flood boundaries. Road conditions may not be covered.",
    "รายงานจากสถานีตรวจวัดจริง": "Reports from monitoring stations",
    "แตะหมายเลขเพื่อโทรออก": "Tap a number to call",
    "การแจ้งเตือนและเบอร์ติดต่อฉุกเฉิน": "Alerts and emergency contacts",
    "ดูสถานีตรวจวัด จุดรายงานน้ำล้นตลิ่ง และการแจ้งเตือนก่อนเดินทาง": "View monitoring stations, overflow reports, and travel alerts.",
    "สถานการณ์จากสถานี": "Station reports",
    "จุดช่วยเหลือ": "Nearby help",
    "ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง": "Could not search for places. Please try again.",
    "กำลังคำนวณเส้นทางไปยัง": "Calculating a route to",
    "ไม่พบเส้นทางขับรถในแผนที่ถึงสถานที่นี้": "No mapped driving route was found to this location.",
    "ตรวจสอบสภาพถนนจริงก่อนเดินทาง": "Check actual road conditions before traveling.",
    "สถานีระดับน้ำใกล้ถนนเป็นเพียงสัญญาณให้ตรวจสอบ": "Nearby water-level stations are only a signal to verify conditions.",
    "ไม่มีข้อมูลจากสถานี": "No station data",
    "ไม่พบสถานีที่ตรงกับตัวกรอง": "No stations match the filters.",
    "ยังไม่มีข้อมูลสถานีให้แสดง": "No station data to display.",
    "โหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรชเพื่อลองอีกครั้ง": "Failed to load data. Press Refresh to try again.",
    "เชื่อมต่อข้อมูลสถานีไม่สำเร็จ": "Could not connect to station data.",
    "อัปเดตข้อมูลไม่สำเร็จ": "Could not update data.",
    "ข้อมูลที่แสดงเป็นข้อมูลครั้งก่อน โปรดลองรีเฟรชอีกครั้ง": "The displayed data is from the previous update. Please refresh.",
    "หมดเวลารอข้อมูล": "Data request timed out.",
    "เส้นทาง": "Route",
    "แนะนำตามระยะทาง": "Recommended by distance",
    "เวลาประมาณ": "Approx.",
    "ยังไม่มีข้อมูลสถานีเพียงพอสำหรับตรวจแนวเส้นทาง": "Not enough recent station data to check this route.",
    "ไม่พบสถานีระดับน้ำเสี่ยงภายใน 1 กม.": "No risk-level stations found within 1 km.",
    "พบสถานีน้ำล้นตลิ่งใกล้แนวถนน": "Overflow stations found near this road",
    "พบสถานีน้ำมากใกล้แนวถนน": "High-water stations found near this road",
    "ถนนที่ไม่มีชื่อในแผนที่": "Unnamed road on map",
    "ดูเส้นทางที่เลือกบนแผนที่": "View selected route on the map",
    "เส้นทางที่คำนวณได้": "Mapped route",
    "ยังยืนยันสภาพถนนจริงไม่ได้": "Actual road conditions are not verified.",
    "ไม่พบสถานีระดับน้ำเสี่ยงใกล้แนวเส้นทาง": "No risk-level stations found near the route",
    "ต้นทาง:": "From:",
    "ปลายทาง:": "To:",
    "จังหวัด": "Province",
    "อำเภอ": "District",
    "หน่วยงาน": "Agency",
    "อ่านค่าเมื่อ": "Read",
    "นาทีที่แล้ว": "min ago",
    "ชั่วโมงที่แล้ว": "hr ago",
    "ค้นหาตำแหน่งและคำนวณเส้นทางขับรถ": "Search locations and calculate driving routes",
    "พบ": "Found",
    "เส้นทางในโครงข่ายแผนที่จาก": "mapped routes from",
    "ไป": "to",
    "ระยะและเวลาเป็นค่าประมาณ": "distance and time are estimates",
    "ตรวจสอบข้อมูลจากหน่วยงานทางการ": "Check official information",
    "ค้นหาที่พักพิงใกล้ฉันใน Google Maps": "Search nearby shelters in Google Maps",
    "ค้นหาโรงพยาบาลใกล้ฉันใน Google Maps": "Search nearby hospitals in Google Maps",
  };

  const attributes = {
    "ค้นหาสถานีหรือจังหวัด": "Search stations or provinces",
    "กรองตามจังหวัด": "Filter by province",
    "กรองตามสถานะ": "Filter by status",
    "รีเฟรชข้อมูล": "Refresh data",
    "แผนที่ประเทศไทยแสดงสถานีวัดระดับน้ำและเส้นทาง": "Thailand map showing water monitoring stations and routes",
    "คำอธิบายสัญลักษณ์": "Map legend",
    "NamTuam นํ้าท่วม หน้าแรก": "NamTuam flood watch home",
    "เปลี่ยนภาษา": "Switch language",
    "ธีมมืด": "Dark theme",
    "ธีมสว่าง": "Light theme",
    "เปลี่ยนเป็นธีมมืด": "Switch to dark theme",
    "เปลี่ยนเป็นธีมสว่าง": "Switch to light theme",
  };

  const originals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const toggle = document.getElementById("language-toggle");
  let language = "th";
  try {
    language = localStorage.getItem("namtuam-language") === "en" ? "en" : "th";
  } catch (error) {
    console.warn("Could not read the saved language preference.", error);
  }
  const translationEntries = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);

  function translated(value) {
    const trimmed = value.trim();
    if (translations[trimmed]) return value.replace(trimmed, translations[trimmed]);
    let result = value;
    for (const [source, target] of translationEntries) {
      if (source.length >= 3 && result.includes(source)) result = result.replaceAll(source, target);
    }
    return result;
  }

  function translateTextNode(node) {
    const current = node.nodeValue;
    const saved = originals.get(node);
    if (saved && current === saved.value && saved.language === language) return;
    const source = saved && current === saved.value ? saved.source : current;
    const next = language === "en" ? translated(source) : source;
    originals.set(node, { source, value: next, language });
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateElementAttributes(element) {
    for (const name of ["placeholder", "aria-label", "title"]) {
      if (!element.hasAttribute(name)) continue;
      let states = attributeOriginals.get(element);
      if (!states) {
        states = {};
        attributeOriginals.set(element, states);
      }
      const current = element.getAttribute(name);
      const previous = states[name];
      if (previous && current === previous.value && previous.language === language) continue;
      const source = previous && current === previous.value ? previous.source : current;
      const next = language === "en" ? (attributes[source] || translations[source] || source) : source;
      states[name] = { source, value: next, language };
      if (current !== next) element.setAttribute(name, next);
    }
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root !== document) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateTextNode(walker.currentNode);
    if (root.nodeType === Node.ELEMENT_NODE) {
      for (const element of root.querySelectorAll("*")) translateElementAttributes(element);
    }
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    document.documentElement.lang = language;
    toggle.textContent = language === "en" ? "TH" : "EN";
    try {
      localStorage.setItem("namtuam-language", language);
    } catch (error) {
      console.warn("Could not save the language preference in this browser.", error);
    }
    translateTree(document.body);
    window.dispatchEvent(new CustomEvent("namtuam-languagechange", { detail: { language } }));
  }

  toggle.addEventListener("click", () => setLanguage(language === "th" ? "en" : "th"));
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") translateTextNode(record.target);
      for (const node of record.addedNodes || []) translateTree(node);
      if (record.type === "attributes") translateElementAttributes(record.target);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] });
  setLanguage(language);
})();
