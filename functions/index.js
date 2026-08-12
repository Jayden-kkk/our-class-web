const { onRequest } = require("firebase-functions/v2/https");
const Timetable = require("comcigan-parser");
const cors = require("cors")({ origin: true });

// 날짜 포맷 (YY-MM-DD)
function formatDate(date) {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

// 실제 수업일(월~금) 기준으로 주차 범위 계산
function getCurrentWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    // 기존 +5(토요일)에서 +4(금요일)로 수정
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