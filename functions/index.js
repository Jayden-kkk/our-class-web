const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });

// 컴시간(comcigan) 측의 JS 난독화(hour-obfuscated-v2)를 자동으로 복호화하기 위한 패치
function patchComciganIconv() {
    const iconvPaths = ["iconv-lite", "comcigan-parser/node_modules/iconv-lite"];
    for (const modPath of iconvPaths) {
        try {
            const iconv = require(modPath);
            if (iconv && !iconv._comciganPatched) {
                const origDecode = iconv.decode;
                iconv.decode = function (buf, enc) {
                    let str = origDecode.call(this, buf, enc);
                    if (typeof str === "string" && str.includes("hour-obfuscated")) {
                        str = str.replace(
                            /\/\* hour-obfuscated-[^*]*\*\/\(function\(a,k\)\{[\s\S]*?\}\)\((\[\[[\s\S]*?\]\]),\s*(\d+)\);/g,
                            (match, arrJson, kStr) => {
                                try {
                                    const a = JSON.parse(arrJson);
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
                            }
                        );
                    }
                    return str;
                };
                iconv._comciganPatched = true;
            }
        } catch (e) {
            // ignore if path does not exist
        }
    }
}
patchComciganIconv();

const Timetable = require("comcigan-parser");

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

exports.getTimetable = onRequest(
    {
        region: "us-central1",
        timeoutSeconds: 30,
        memory: "256MB",
    },
    (req, res) => {
        return cors(req, res, async () => {
            try {
                if (typeof global.numberPart === "undefined") {
                    global.numberPart = "";
                }

                const timetable = new Timetable();
                await timetable.init();

                const schoolList = await timetable.search("양영중");
                if (!schoolList || schoolList.length === 0) {
                    return res.status(404).json({ success: false, error: "양영중학교를 찾을 수 없습니다." });
                }

                const targetSchool = schoolList.find((s) => s.name.includes("양영중")) || schoolList[0];

                // 파라미터 없이 기본(현재) 시간표만 파싱
                timetable.setSchool(targetSchool.code);
                const result = await timetable.getTimetable();

                // 1학년 6반 데이터
                const classSchedule = result && result[1] && result[1][6] ? result[1][6] : null;

                return res.status(200).json({
                    success: true,
                    schoolName: targetSchool.name,
                    grade: 1,
                    classNum: 6,
                    currentWeekRange: getCurrentWeekRange(),
                    schedule: classSchedule
                });

            } catch (error) {
                console.error("시간표 처리 오류:", error);
                return res.status(500).json({ success: false, error: error.message || error.toString() });
            }
        });
    }
);