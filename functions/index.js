const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const http = require("http");
const crypto = require("crypto");
const vm = require("vm");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");

// 날짜 포맷 (YY-MM-DD)
function formatDate(date) {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

// KST (Asia/Seoul) 기준 현재 시각 반환
function getKSTDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 60 * 60000));
}

// 실제 수업일(월~금) 기준으로 주차 범위 계산
function getCurrentWeekRange() {
    const kstNow = getKSTDate();
    const dayOfWeek = kstNow.getDay(); // 0(일), 1(월), 2(화), 3(수), 4(목), 5(금), 6(토)
    let distanceToMonday = 1 - dayOfWeek;
    if (dayOfWeek === 0) distanceToMonday = 1;
    else if (dayOfWeek === 6) distanceToMonday = 2;

    const monday = new Date(kstNow);
    monday.setDate(kstNow.getDate() + distanceToMonday);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return `${formatDate(monday)} ~ ${formatDate(friday)}`;
}

// 타임아웃이 적용된 HTTP GET 헬퍼
function httpGet(url, headers = {}, timeoutMs = 7000) {
    return new Promise((resolve, reject) => {
        const req = http.get(
            url,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                    ...headers
                },
                timeout: timeoutMs
            },
            (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () =>
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: Buffer.concat(chunks)
                    })
                );
            }
        );
        req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Timeout (${timeoutMs}ms) fetching ${url}`));
        });
        req.on("error", reject);
    });
}

// 컴시간 다중 JS 난독화(hour-obfuscated-v2 + hour-ajax-obfuscated-v1 등) 반복 복호화
function deobfuscateComcigan(input) {
    let prev;
    let cur = input;
    const regex = /\/\* hour-[^*]*obfuscated-[^*]*\*\/\(function\(a,k\)\{[\s\S]*?\}\)\((\[\[[\s\S]*?\]\]),\s*(\d+)\);/g;
    do {
        prev = cur;
        cur = cur.replace(regex, (match, arrExpr, kStr) => {
            try {
                const a = vm.runInNewContext(arrExpr, { String });
                const k = parseInt(kStr, 10);
                let s = "";
                for (let i = 0; i < a.length; i++) {
                    if (a[i][0]) {
                        s += a[i][1];
                        continue;
                    }
                    const b = a[i][1];
                    for (let j = 0; j < b.length; j += 4) {
                        s += String.fromCharCode(
                            parseInt(b.substr(j, 4), 16) ^ ((k + (j / 4) * 13) & 255)
                        );
                    }
                }
                return s;
            } catch (err) {
                return match;
            }
        });
    } while (cur !== prev);
    return cur;
}

// 양영중학교 시간표 파싱 (enc5 AES-256-CBC + QnmsbChange XOR + X-Hour-Token 대응)
async function fetchYangYoungTimetable(grade = 1, classNum = 6) {
    let stUrl = "http://comci.net:4082/st";
    try {
        const hostRes = await httpGet("http://xn--s39aj90b0nb2xw6xh.kr", {}, 3500);
        const hostBody = hostRes.body.toString("utf8");
        const frameMatch = hostBody.replace(/'/g, '"').match(/<frame [^>]*src="([^"]+)"/i);
        if (frameMatch && frameMatch[1]) {
            stUrl = frameMatch[1];
        }
    } catch (_) {
        // 기본 stUrl 사용
    }

    const parsedStUrl = new URL(stUrl);
    const baseUrl = parsedStUrl.origin;

    const stRes = await httpGet(stUrl, {}, 7000);
    const setCookies = stRes.headers["set-cookie"] || [];
    const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");

    const rawHtml = iconv.decode(stRes.body, "EUC-KR");
    const html = deobfuscateComcigan(rawHtml);

    const tokenMatch = html.match(/window\.__HourRequestToken\s*=\s*'([^']+)'/);
    const token = tokenMatch ? tokenMatch[1] : "";

    const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    const mainScript = scriptMatches.map((m) => m[1]).find((s) => s.includes("function school_ra"));
    if (!mainScript) {
        throw new Error("컴시간 스크립트 소스를 찾을 수 없습니다.");
    }

    // HChange AES-256-CBC 키 추출
    const keyExprMatch = mainScript.match(/CryptoJS\.enc\.Hex\.parse\((\(function\(a\)\{[\s\S]*?\}\)\(\[[^\]]+\]\))\)/);
    const aesKeyHex = keyExprMatch
        ? vm.runInNewContext(keyExprMatch[1])
        : "0c2bd8608f8e43a59cabdf160b3212ff1470d331a8d6d3e9345d8726927688da";

    function decryptHChange(rawText) {
        const data = rawText.replace(/\x00+$/, "").trim();
        if (!data.startsWith("enc1:") && !data.startsWith("enc5:")) return data;
        const parts = data.split(":");
        if (parts.length !== 4) throw new Error("암호화된 시간표 응답 형식이 올바르지 않습니다.");
        const enc = parts[0] === "enc5" ? "base64" : "hex";
        const iv = Buffer.from(parts[1], enc);
        const ciphertext = Buffer.from(parts[2], enc);
        const key = Buffer.from(aesKeyHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        const decrypted = decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
        return decrypted.replace(/\x00+$/, "");
    }

    // QnmsbChange XOR 키 추출
    const qnmsbKeyMatch = mainScript.match(/function QnmsbChange[\s\S]*?var 키=(String\.fromCharCode\([^)]+\));/);
    const qnmsbKey = qnmsbKeyMatch
        ? vm.runInNewContext(qnmsbKeyMatch[1], { String })
        : "LEON95_Vs`_O";

    function qnmsbChange(cipherB64) {
        if (!cipherB64) return "";
        const buf = Buffer.from(cipherB64, "base64");
        const out = Buffer.alloc(buf.length);
        for (let i = 0; i < buf.length; i++) {
            out[i] = buf[i] ^ qnmsbKey.charCodeAt(i % qnmsbKey.length);
        }
        return iconv.decode(out, "EUC-KR");
    }

    const routeMatch = mainScript.match(/url\s*:\s*'\.\/([^?']+)\?'/);
    const route = routeMatch ? routeMatch[1] : "970543";

    const searchPrefixMatch = mainScript.match(/btoa\('([^']+)'\s*\+\s*encodeURIComponent\(sc\)\s*\+\s*'([^']*)'\)/);
    const searchPrefix = searchPrefixMatch ? searchPrefixMatch[1] : "76952l";
    const searchSuffix = searchPrefixMatch ? searchPrefixMatch[2] : "_enc5";

    const scDataMatch = mainScript.match(/sc_data\('([^']+)'/);
    const scPrefix = scDataMatch ? scDataMatch[1] : "11125_";

    const reqHeaders = {
        "X-Hour-Token": token,
        "Referer": stUrl,
        ...(cookieHeader ? { "Cookie": cookieHeader } : {})
    };

    // 학교 검색 (기본값: 양영중학교 10589)
    let targetSchoolCode = 10589;
    let targetSchoolName = "양영중학교";

    try {
        const searchB64 = Buffer.from(searchPrefix + encodeURIComponent("양영중") + searchSuffix).toString("base64");
        const searchUrl = `${baseUrl}/${route}?${encodeURIComponent(searchB64)}`;
        const searchRes = await httpGet(searchUrl, reqHeaders, 5000);
        if (searchRes.status === 200) {
            const searchDec = decryptHChange(searchRes.body.toString("utf8"));
            const searchJson = JSON.parse(searchDec.substr(0, searchDec.lastIndexOf("}") + 1));
            const schoolList = searchJson["학교검색"] || [];
            const divMatch = mainScript.match(/Math\.floor\(학교명단\[i\]\[0\]\/(\d+)\)\+(\d+)/);
            const divNum = divMatch ? Number(divMatch[1]) : 6347;
            const divAdd = divMatch ? Number(divMatch[2]) : 2;

            for (const item of schoolList) {
                if (!item || item[0] === 0) continue;
                const name = qnmsbChange(item[2]);
                const rIdx = Math.floor(item[0] / divNum) + divAdd;
                const code = Number(qnmsbChange(item[rIdx]));
                if (name && code) {
                    targetSchoolName = name;
                    targetSchoolCode = code;
                    if (name.includes("양영중")) break;
                }
            }
        }
    } catch (searchErr) {
        console.warn("학교 검색 생략, 기본 코드(10589) 사용:", searchErr.message);
    }

    // 시간표 데이터 조회
    const ttParam = Buffer.from(`${scPrefix}${targetSchoolCode}_0_1${searchSuffix}`).toString("base64");
    const ttUrl = `${baseUrl}/${route}?${ttParam}`;
    const ttRes = await httpGet(ttUrl, reqHeaders, 7000);
    if (ttRes.status !== 200) {
        throw new Error(`컴시간 시간표 응답 오류 (HTTP ${ttRes.status})`);
    }

    let ttDec = decryptHChange(ttRes.body.toString("utf8"));
    ttDec = ttDec.substr(0, ttDec.lastIndexOf("}") + 1);
    const timetableJson = JSON.parse(ttDec);

    const fnNameMatch = mainScript.match(/function (자료\d+)\s*\(/);
    if (!fnNameMatch) {
        throw new Error("시간표 생성 함수를 찾을 수 없습니다.");
    }
    const fnName = fnNameMatch[1];

    const sandbox = {
        window: { __HourRequestToken: token, localStorage: {}, isNaN },
        document: { getElementById: () => ({ value: "1-1" }) },
        $: () => ({
            ajaxError: () => {},
            empty: () => ({ append: () => {} }),
            show: () => {},
            hide: () => {},
            text: () => {}
        }),
        H시간표: timetableJson,
        QnmsbChange: qnmsbChange,
        atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
        btoa: (bin) => Buffer.from(bin, "binary").toString("base64"),
        TextDecoder,
        Uint8Array,
        Number,
        String,
        Array,
        Object,
        Math,
        Date,
        JSON,
        isNaN,
        parseInt,
        encodeURIComponent
    };
    sandbox.$.ajax = () => {};

    const tableHtml = vm.runInNewContext(
        `${mainScript}\nQnmsbChange = this.QnmsbChange;\n${fnName}(H시간표, ${Number(grade)}, ${Number(classNum)});`,
        sandbox,
        { timeout: 3000 }
    );

    const $ = cheerio.load(tableHtml);
    const weekdayString = ["일", "월", "화", "수", "목", "금", "토"];
    const schedule = [];

    $("tr").each(function (timeIdx) {
        const currentTime = timeIdx - 2;
        if (timeIdx <= 1) return;

        $(this).find("td").each(function (weekDayIdx) {
            const currentWeekDay = weekDayIdx - 1;
            if (weekDayIdx === 0 || weekDayIdx === 6) return;

            if (!schedule[currentWeekDay]) {
                schedule[currentWeekDay] = [];
            }

            const subject = $(this).contents().first().text().trim();
            const teacher = $(this).contents().last().text().trim();
            schedule[currentWeekDay][currentTime] = {
                grade,
                class: classNum,
                weekday: currentWeekDay,
                weekdayString: weekdayString[weekDayIdx],
                classTime: currentTime + 1,
                teacher: subject && teacher === subject ? "" : teacher,
                subject
            };
        });
    });

    return {
        schoolName: targetSchoolName,
        grade,
        classNum,
        schedule
    };
}

let cachedResponse = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 메모리 캐시

exports.getTimetable = onRequest(
    {
        region: "us-central1",
        timeoutSeconds: 30,
        memory: "256MB",
    },
    (req, res) => {
        return cors(req, res, async () => {
            try {
                const forceRefresh = req.query && (req.query.refresh === "1" || req.query.refresh === "true");
                const now = Date.now();

                if (!forceRefresh && cachedResponse && (now - cachedAt < CACHE_TTL_MS)) {
                    return res.status(200).json({
                        ...cachedResponse,
                        currentWeekRange: getCurrentWeekRange(),
                        cached: true
                    });
                }

                const data = await fetchYangYoungTimetable(1, 6);
                const payload = {
                    success: true,
                    schoolName: data.schoolName,
                    grade: data.grade,
                    classNum: data.classNum,
                    currentWeekRange: getCurrentWeekRange(),
                    schedule: data.schedule
                };

                cachedResponse = payload;
                cachedAt = now;

                return res.status(200).json(payload);
            } catch (error) {
                console.error("시간표 처리 오류:", error);
                if (cachedResponse) {
                    return res.status(200).json({
                        ...cachedResponse,
                        currentWeekRange: getCurrentWeekRange(),
                        staleCache: true
                    });
                }
                return res.status(500).json({
                    success: false,
                    error: error.message || error.toString()
                });
            }
        });
    }
);
