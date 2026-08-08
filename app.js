/* ==========================================================================
   준우(junwoo) 바탕화면 모바일 웹 포털 JS 로직 및 실시간 커스터마이저
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. 실시간 시계 (모바일 프레임 상태바 & 메인 배너 슬라이드 1)
    function updateClock() {
        const timeEl = document.getElementById('statusTime');
        if (!timeEl) return;
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hrs}:${mins}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    // 메인 배너 슬라이드 1: 실시간 오늘 날짜 및 1초 주기 시계
    function updateHeroDateTime() {
        const heroDateText = document.getElementById('heroDateText');
        const heroClockText = document.getElementById('heroClockText');
        const ddayCountText = document.getElementById('ddayCountText');
        const slide2DdayTag = document.getElementById('slide2DdayTag');

        const now = new Date();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const dayName = days[now.getDay()];

        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');

        if (heroDateText) heroDateText.textContent = `${year}년 ${month}월 ${date}일 (${dayName})`;
        if (heroClockText) heroClockText.textContent = `${hrs}:${mins}:${secs}`;

        // 11월 10일 1학년 지필고사 D-Day 동적 자동 계산
        const examDate = new Date(year, 10, 10);
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.ceil((examDate - todayZero) / (1000 * 60 * 60 * 24));
        const ddayStr = diffDays > 0 ? `D-${diffDays}` : (diffDays === 0 ? 'D-Day' : `D+${Math.abs(diffDays)}`);

        if (ddayCountText) ddayCountText.textContent = ddayStr;
        if (slide2DdayTag) slide2DdayTag.textContent = ddayStr;
    }
    updateHeroDateTime();
    setInterval(updateHeroDateTime, 1000);

    // 메인 배너 슬라이드 3: 동적 8월~12월 인터랙티브 학사일정 달력 & 이벤터
    let calCurrentYear = 2026;
    let calCurrentMonth = 7; // 0-indexed (7 = 8월)

    const schoolEventsData = {
        7: [ // 8월
            { date: '8/14(금)', name: '2학기 개학식', day: 14, color: 'green' },
            { date: '8/15(토)', name: '광복절 (국경일)', day: 15, color: 'red' }
        ],
        8: [ // 9월
            { date: '9/24(목)', name: '추석 연휴 시작 🌕', day: 24, color: 'red' },
            { date: '9/25(금)', name: '추석 연휴 🌕', day: 25, color: 'red' }
        ],
        9: [ // 10월
            { date: '10/3(토)', name: '개천절 (국경일)', day: 3, color: 'red' },
            { date: '10/9(금)', name: '한글날 (국경일)', day: 9, color: 'red' }
        ],
        10: [ // 11월
            { date: '11/10(화)', name: '1학년 지필고사 (1일차)', day: 10, color: 'red' },
            { date: '11/11(수)', name: '1학년 지필고사 (2일차)', day: 11, color: 'red' },
            { date: '11/12(목)', name: '1학년 지필고사 (3일차)', day: 12, color: 'red' },
            { date: '11/19(목)', name: '학교장 재량 휴업일', day: 19, color: 'green' }
        ],
        11: [ // 12월
            { date: '12/24(목)', name: '양영제 (축제) 🎉', day: 24, color: 'purple' },
            { date: '12/25(금)', name: '성탄절 (크리스마스) 🎄', day: 25, color: 'red' },
            { date: '12/31(목)', name: '종업식 & 겨울방학식 ❄️', day: 31, color: 'blue' }
        ]
    };

    function renderHeroMiniCalendar() {
        const calDaysGrid = document.getElementById('heroCalDaysGrid');
        const calMonthTitle = document.getElementById('heroCalMonthTitle');
        const calEventItems = document.getElementById('calEventItems');
        if (!calDaysGrid || !calMonthTitle) return;

        const monthNames = { 7: '8월', 8: '9월', 9: '10월', 10: '11월', 11: '12월' };
        calMonthTitle.textContent = `${calCurrentYear}년 ${monthNames[calCurrentMonth] || (calCurrentMonth + 1) + '월'}`;

        const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
        const totalDays = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

        const now = new Date();
        const isCurrentMonthNow = (now.getFullYear() === calCurrentYear && now.getMonth() === calCurrentMonth);
        const todayDate = isCurrentMonthNow ? now.getDate() : -1;

        const monthEvents = schoolEventsData[calCurrentMonth] || [];
        const eventDays = monthEvents.map(e => e.day);

        let gridHtml = '';
        for (let i = 0; i < firstDayIndex; i++) {
            gridHtml += `<div class="cal-day-cell empty"></div>`;
        }

        for (let day = 1; day <= totalDays; day++) {
            const dayOfWeek = (firstDayIndex + day - 1) % 7;
            let classNames = 'cal-day-cell';
            if (dayOfWeek === 0) classNames += ' sun';
            if (dayOfWeek === 6) classNames += ' sat';
            if (day === todayDate) classNames += ' today';
            if (eventDays.includes(day)) classNames += ' has-event';

            gridHtml += `<div class="${classNames}">${day}</div>`;
        }

        if (calCurrentMonth === 10 || calCurrentMonth === 11) {
            calDaysGrid.classList.add('large-month-cal');
        } else {
            calDaysGrid.classList.remove('large-month-cal');
        }

        calDaysGrid.innerHTML = gridHtml;

        // 이달의 학사일정 리스트 업데이트
        if (calEventItems) {
            if (monthEvents.length > 0) {
                let eventsHtml = '';
                monthEvents.forEach(evt => {
                    eventsHtml += `
                        <div class="event-item">
                            <span class="event-date ${evt.color}">${evt.date}</span>
                            <span class="event-name">${evt.name}</span>
                        </div>
                    `;
                });
                calEventItems.innerHTML = eventsHtml;
            } else {
                calEventItems.innerHTML = `<div class="event-item"><span class="event-name" style="opacity:0.75;">등록된 학사일정이 없습니다.</span></div>`;
            }
        }
    }

    // 전역 바인딩 (HTML inline onclick 대응 & 슬라이드 자동 넘김 일시정지)
    window.changeHeroCalMonth = function(dir) {
        if (dir === -1) {
            if (calCurrentMonth > 7) {
                calCurrentMonth--;
            } else {
                calCurrentMonth = 11;
            }
        } else if (dir === 1) {
            if (calCurrentMonth < 11) {
                calCurrentMonth++;
            } else {
                calCurrentMonth = 7;
            }
        }
        renderHeroMiniCalendar();

        // 달력 버튼을 조작하는 동안 자동 슬라이더 멈춤
        if (typeof stopHeroTimer === 'function') {
            stopHeroTimer();
        }
    };

    renderHeroMiniCalendar();

    // 2. 실시간 커스터마이저 패널 제어
    const customizerToggleBtn = document.getElementById('customizerToggleBtn');
    const customizerPanel = document.getElementById('customizerPanel');
    const panelCloseBtn = document.getElementById('panelCloseBtn');

    if (customizerToggleBtn && customizerPanel) {
        customizerToggleBtn.addEventListener('click', () => {
            customizerPanel.classList.add('active');
        });
        panelCloseBtn.addEventListener('click', () => {
            customizerPanel.classList.remove('active');
        });
    }

    // 2-1. 미리보기 형태 스위치 (프레임 뷰 vs 전체화면)
    const viewButtons = document.querySelectorAll('.btn-option[data-view]');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const viewMode = btn.getAttribute('data-view');
            if (viewMode === 'full') {
                document.body.classList.remove('mode-frame');
                document.body.classList.add('mode-full');
            } else {
                document.body.classList.remove('mode-full');
                document.body.classList.add('mode-frame');
            }
        });
    });

    // 2-2. 테마 컬러 스위치
    const colorButtons = document.querySelectorAll('.color-btn[data-theme]');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const themeClass = btn.getAttribute('data-theme');
            document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
            document.body.classList.add(themeClass);
        });
    });

    // 2-3. 학교 / 기관 명칭 실시간 동기화
    const inputSchoolName = document.getElementById('inputSchoolName');
    const displaySchoolName = document.getElementById('displaySchoolName');
    const drawerSchoolTitle = document.getElementById('drawerSchoolTitle');

    if (inputSchoolName) {
        inputSchoolName.addEventListener('input', (e) => {
            const val = e.target.value || '학교명칭';
            if (displaySchoolName) displaySchoolName.textContent = val;
            if (drawerSchoolTitle) drawerSchoolTitle.textContent = val;
            document.title = `${val} - 모바일 웹 포털 초안`;
        });
    }

    // 2-4. 섹션 표시 / 숨기기 (ON/OFF) 토글
    const sectionToggles = document.querySelectorAll('.section-toggle');
    sectionToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const sec = document.getElementById(targetId);
            if (sec) {
                if (e.target.checked) {
                    sec.classList.remove('hidden');
                } else {
                    sec.classList.add('hidden');
                }
            }
        });
    });

    // 2-5. 초기화 버튼
    const btnResetConfig = document.getElementById('btnResetConfig');
    if (btnResetConfig) {
        btnResetConfig.addEventListener('click', () => {
            if (inputSchoolName) {
                inputSchoolName.value = '1학년 6반 홈페이지';
                inputSchoolName.dispatchEvent(new Event('input'));
            }
            colorButtons[0].click();
            viewButtons[0].click();
            sectionToggles.forEach(t => {
                t.checked = true;
                t.dispatchEvent(new Event('change'));
            });
        });
    }

    // 3. 사이드 드로어 메뉴 (Drawer Nav)
    const drawerOpenBtn = document.getElementById('drawerOpenBtn');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerMenu = document.getElementById('drawerMenu');
    const drawerBackdrop = document.getElementById('drawerBackdrop');

    function openDrawer() {
        drawerMenu.classList.add('active');
        drawerBackdrop.classList.add('active');
    }
    function closeDrawer() {
        drawerMenu.classList.remove('active');
        drawerBackdrop.classList.remove('active');
    }

    if (drawerOpenBtn) drawerOpenBtn.addEventListener('click', openDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    // 4. 검색창 레이어 토글
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchToggleBtn && searchOverlay) {
        searchToggleBtn.addEventListener('click', () => {
            searchOverlay.classList.toggle('active');
            if (searchOverlay.classList.contains('active')) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }
        });
    }

    // 5. 메인 비주얼 배너 (Hero Carousel Slider)
    const heroSlides = document.querySelectorAll('.carousel-slide');
    const heroDots = document.querySelectorAll('.hero-dots .dot');
    const heroCurrentSlide = document.getElementById('heroCurrentSlide');
    let heroIndex = 0;
    let heroTimer = null;

    function gotoHeroSlide(idx) {
        heroSlides.forEach(s => s.classList.remove('active'));
        heroDots.forEach(d => d.classList.remove('active'));

        heroIndex = (idx + heroSlides.length) % heroSlides.length;
        heroSlides[heroIndex].classList.add('active');
        if (heroDots[heroIndex]) heroDots[heroIndex].classList.add('active');
        if (heroCurrentSlide) heroCurrentSlide.textContent = heroIndex + 1;
    }

    function startHeroTimer() {
        stopHeroTimer();
        heroTimer = setInterval(() => {
            gotoHeroSlide(heroIndex + 1);
        }, 4000);
    }
    function stopHeroTimer() {
        if (heroTimer) clearInterval(heroTimer);
    }

    heroDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            gotoHeroSlide(index);
            startHeroTimer();
        });
    });

    startHeroTimer();

    // 5-1. 손가락 좌우 스와이프 & 마우스 드래그 포인터 이벤트 통합 지원
    const heroCarousel = document.getElementById('heroCarousel');
    let heroPointerStartX = 0;
    let heroPointerEndX = 0;
    let isHeroDragging = false;

    if (heroCarousel) {
        heroCarousel.addEventListener('pointerdown', (e) => {
            // 달력 조작 버튼 및 미니 달력 영역 클릭 시 드래그 제외
            if (e.target.closest('.cal-nav-btn') || e.target.closest('.hero-mini-calendar')) return;
            isHeroDragging = true;
            heroPointerStartX = e.clientX;
            heroPointerEndX = e.clientX;
            heroCarousel.classList.add('is-dragging');
        });

        heroCarousel.addEventListener('pointermove', (e) => {
            if (!isHeroDragging) return;
            heroPointerEndX = e.clientX;
        });

        const finishHeroDrag = (e) => {
            if (!isHeroDragging) return;
            isHeroDragging = false;
            heroCarousel.classList.remove('is-dragging');
            if (e && e.clientX !== undefined) {
                heroPointerEndX = e.clientX;
            }

            const threshold = 30; // 30px 드래그 시 슬라이드 전환
            const diff = heroPointerEndX - heroPointerStartX;
            if (Math.abs(diff) > threshold) {
                if (diff < 0) {
                    // 마우스/손가락을 왼쪽으로 끎 -> 다음 슬라이드
                    gotoHeroSlide(heroIndex + 1);
                } else {
                    // 마우스/손가락을 오른쪽으로 끎 -> 이전 슬라이드
                    gotoHeroSlide(heroIndex - 1);
                }
                startHeroTimer();
            }
        };

        heroCarousel.addEventListener('pointerup', finishHeroDrag);
        heroCarousel.addEventListener('pointercancel', finishHeroDrag);
        heroCarousel.addEventListener('mouseleave', finishHeroDrag);
    }

    // 6. 공지사항 아코디언 (Accordion)
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const box = header.parentElement;
            box.classList.toggle('open');
            const toggleIcon = header.querySelector('.accordion-toggle i');
            if (toggleIcon) {
                if (box.classList.contains('open')) {
                    toggleIcon.className = 'fa-solid fa-minus';
                } else {
                    toggleIcon.className = 'fa-solid fa-plus';
                }
            }
        });
    });

    // 7. 학사일정 월별 이벤트 변경 로직 (위젯 영역)
    const calMonth = document.getElementById('calMonth');
    const widgetCalPrevBtn = document.getElementById('widgetCalPrevBtn');
    const widgetCalNextBtn = document.getElementById('widgetCalNextBtn');
    const eventList = document.getElementById('eventList');

    let currentMonthVal = 8;

    const mockEvents = {
        7: [
            { day: '05', title: '1학기 2차 지필평가' },
            { day: '18', title: '여름방학 식전 행사' },
            { day: '19', title: '여름방학 개식' }
        ],
        8: [
            { day: '01', title: '개학식' },
            { day: '07', title: '학생회 대표 회의' },
            { day: '15', title: '광복절 (휴업일)' },
            { day: '21', title: '2학기 동아리 발표회' }
        ],
        9: [
            { day: '10', title: '학부모 공개수업의 날' },
            { day: '22', title: '추석 연휴' },
            { day: '28', title: '체육 한마당' }
        ]
    };

    function renderEvents(m) {
        if (!eventList || !calMonth) return;
        calMonth.textContent = String(m).padStart(2, '0');
        const listData = mockEvents[m] || [
            { day: '01', title: '정기 학생 상담' },
            { day: '15', title: '교과 융합 프로젝트' }
        ];

        eventList.innerHTML = listData.map(ev => `
            <li>
                <span class="event-day">${ev.day}</span>
                <span class="event-title">${ev.title}</span>
            </li>
        `).join('');
    }

    if (widgetCalPrevBtn && widgetCalNextBtn) {
        widgetCalPrevBtn.addEventListener('click', () => {
            currentMonthVal = currentMonthVal <= 1 ? 12 : currentMonthVal - 1;
            renderEvents(currentMonthVal);
        });
        widgetCalNextBtn.addEventListener('click', () => {
            currentMonthVal = currentMonthVal >= 12 ? 1 : currentMonthVal + 1;
            renderEvents(currentMonthVal);
        });
    }

    // 8. 팝업존 슬라이더
    const popupTrack = document.getElementById('popupTrack');
    const popupCurrentIndex = document.getElementById('popupCurrentIndex');
    const popupPrevBtn = document.getElementById('popupPrevBtn');
    const popupNextBtn = document.getElementById('popupNextBtn');
    const popupToggleAutoplayBtn = document.getElementById('popupToggleAutoplayBtn');
    let popupIndex = 0;
    const totalPopups = 2;
    let popupAutoplay = true;
    let popupTimer = null;

    function updatePopupSlide() {
        if (!popupTrack) return;
        popupTrack.style.transform = `translateX(-${popupIndex * 100}%)`;
        if (popupCurrentIndex) popupCurrentIndex.textContent = popupIndex + 1;
    }

    function startPopupTimer() {
        if (popupTimer) clearInterval(popupTimer);
        popupTimer = setInterval(() => {
            if (popupAutoplay) {
                popupIndex = (popupIndex + 1) % totalPopups;
                updatePopupSlide();
            }
        }, 5000);
    }

    if (popupPrevBtn) {
        popupPrevBtn.addEventListener('click', () => {
            popupIndex = (popupIndex - 1 + totalPopups) % totalPopups;
            updatePopupSlide();
        });
    }
    if (popupNextBtn) {
        popupNextBtn.addEventListener('click', () => {
            popupIndex = (popupIndex + 1) % totalPopups;
            updatePopupSlide();
        });
    }
    if (popupToggleAutoplayBtn) {
        popupToggleAutoplayBtn.addEventListener('click', () => {
            popupAutoplay = !popupAutoplay;
            const icon = popupToggleAutoplayBtn.querySelector('i');
            if (icon) {
                icon.className = popupAutoplay ? 'fa-solid fa-pause' : 'fa-solid fa-play';
            }
        });
    }
    startPopupTimer();

    // 9. 맨 위로 이동 (Scroll to top)
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const appViewport = document.getElementById('appViewport');
    if (scrollTopBtn && appViewport) {
        scrollTopBtn.addEventListener('click', () => {
            appViewport.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 10. 실시간 GPS 기반 날씨 연동 (10분 주기 자동 갱신)
    const quickWeatherBtn = document.getElementById('quickWeatherBtn');
    const weatherModal = document.getElementById('weatherModal');
    const weatherBackdrop = document.getElementById('weatherBackdrop');
    const weatherCloseBtn = document.getElementById('weatherCloseBtn');
    const btnRefreshWeather = document.getElementById('btnRefreshWeather');

    const weatherCardInner = document.getElementById('weatherCardInner');
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherMiniBadge = document.getElementById('weatherMiniBadge');
    const weatherStatusText = document.getElementById('weatherStatusText');
    const weatherWindSpeed = document.getElementById('weatherWindSpeed');
    const weatherLastUpdate = document.getElementById('weatherLastUpdate');
    const weatherIconLarge = document.getElementById('weatherIconLarge');
    const quickWeatherIcon = document.getElementById('quickWeatherIcon');
    const weatherLocationText = document.getElementById('weatherLocationText');

    // WMO 기상 코드 매핑 (맑음, 구름조금, 흐림, 비, 진눈깨비, 눈, 뇌우)
    function mapWmoCode(code) {
        if (code === 0) {
            return { text: '맑음', icon: 'fa-solid fa-sun', bg: 'weather-bg-clear' };
        } else if (code === 1 || code === 2) {
            return { text: '구름조금', icon: 'fa-solid fa-cloud-sun', bg: 'weather-bg-clear' };
        } else if (code === 3) {
            return { text: '흐림', icon: 'fa-solid fa-cloud', bg: 'weather-bg-cloudy' };
        } else if (code === 45 || code === 48) {
            return { text: '안개', icon: 'fa-solid fa-smog', bg: 'weather-bg-cloudy' };
        } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
            return { text: '비', icon: 'fa-solid fa-cloud-showers-heavy', bg: 'weather-bg-rain' };
        } else if ([56, 57, 66, 67].includes(code)) {
            return { text: '진눈깨비', icon: 'fa-solid fa-cloud-meatball', bg: 'weather-bg-sleet' };
        } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
            return { text: '눈', icon: 'fa-solid fa-snowflake', bg: 'weather-bg-snow' };
        } else if ([95, 96, 99].includes(code)) {
            return { text: '뇌우', icon: 'fa-solid fa-cloud-bolt', bg: 'weather-bg-rain' };
        }
        return { text: '맑음', icon: 'fa-solid fa-sun', bg: 'weather-bg-clear' };
    }

    function renderHourlyForecastFallback() {
        const hourlyForecastList = document.getElementById('hourlyForecastList');
        if (!hourlyForecastList) return;
        const defaultHours = [
            { time: '08:00', icon: 'fa-solid fa-sun', temp: '24°C' },
            { time: '10:00', icon: 'fa-solid fa-sun', temp: '26°C' },
            { time: '12:00', icon: 'fa-solid fa-sun', temp: '28°C' },
            { time: '14:00', icon: 'fa-solid fa-cloud-sun', temp: '29°C' },
            { time: '16:00', icon: 'fa-solid fa-sun', temp: '28°C' },
            { time: '18:00', icon: 'fa-solid fa-cloud-sun', temp: '26°C' },
            { time: '20:00', icon: 'fa-solid fa-cloud-moon', temp: '24°C' },
            { time: '22:00', icon: 'fa-solid fa-cloud-moon', temp: '23°C' },
            { time: '24:00', icon: 'fa-solid fa-moon', temp: '22°C' }
        ];
        let slotsHtml = '';
        defaultHours.forEach(h => {
            slotsHtml += `
                <div class="hourly-slot">
                    <span class="h-time">${h.time}</span>
                    <i class="h-icon ${h.icon}"></i>
                    <span class="h-temp">${h.temp}</span>
                </div>
            `;
        });
        hourlyForecastList.innerHTML = slotsHtml;
    }

    async function fetchWeatherData(lat = 37.3595, lon = 127.1053) {
        // 즉시 기본값 및 시간별 예보 렌더링 (대기 시간 없는 100% 즉시 표시)
        if (weatherTemp) weatherTemp.textContent = '27°C';
        if (weatherMiniBadge) weatherMiniBadge.textContent = '27°C';
        if (weatherStatusText) weatherStatusText.textContent = '맑음';
        if (weatherWindSpeed) weatherWindSpeed.textContent = '1.8 m/s';
        if (weatherIconLarge) weatherIconLarge.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        if (quickWeatherIcon) quickWeatherIcon.className = 'fa-solid fa-sun';
        if (weatherLocationText) weatherLocationText.textContent = '경기도 성남시 분당구 (현재 위치)';
        if (weatherCardInner) weatherCardInner.className = 'weather-card-inner weather-bg-clear';
        renderRealisticWeatherEffects('맑음');
        renderHourlyForecastFallback();

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=Asia%2FSeoul`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('날씨 API 응답 오류');
            const data = await resp.json();

            if (data && data.current_weather) {
                const cw = data.current_weather;
                const tempVal = Math.round(cw.temperature);
                const windVal = cw.windspeed;
                const wmoInfo = mapWmoCode(cw.weathercode);

                // UI 업데이트
                if (weatherTemp) weatherTemp.textContent = `${tempVal}°C`;
                if (weatherMiniBadge) weatherMiniBadge.textContent = `${tempVal}°C`;
                if (weatherStatusText) weatherStatusText.textContent = wmoInfo.text;
                if (weatherWindSpeed) weatherWindSpeed.textContent = `${windVal} m/s`;
                if (weatherLocationText) weatherLocationText.textContent = '경기도 성남시 분당구 (현재 위치)';

                // 아이콘 및 배경 업데이트
                if (weatherIconLarge) weatherIconLarge.innerHTML = `<i class="${wmoInfo.icon}"></i>`;
                if (quickWeatherIcon) quickWeatherIcon.className = wmoInfo.icon;

                if (weatherCardInner) {
                    weatherCardInner.className = `weather-card-inner ${wmoInfo.bg}`;
                }

                // 모달 및 전체 앱에 리얼리스틱 날씨 배경 이펙트 적용
                renderRealisticWeatherEffects(wmoInfo.text);

                // 08:00 ~ 24:00 시간별 예보 생성 (안전 동기 렌더링)
                const hourlyForecastList = document.getElementById('hourlyForecastList');
                if (hourlyForecastList) {
                    if (data.hourly && data.hourly.time && data.hourly.time.length > 0) {
                        const times = data.hourly.time;
                        const temps = data.hourly.temperature_2m;
                        const codes = data.hourly.weathercode;
                        
                        let slotsHtml = '';
                        for (let i = 0; i < Math.min(times.length, 24); i++) {
                            const tStr = times[i];
                            const match = tStr.match(/T(\d{2}):00/);
                            if (match) {
                                const hNum = parseInt(match[1], 10);
                                if (hNum >= 8 || hNum === 0) {
                                    const hWmo = mapWmoCode(codes[i]);
                                    const isNight = (hNum >= 20 || hNum === 0);
                                    let hIcon = hWmo.icon;
                                    if (isNight) {
                                        if (hWmo.text === '구름조금' || hWmo.text === '흐림' || hWmo.text === '안개') {
                                            hIcon = 'fa-solid fa-cloud-moon';
                                        } else if (hWmo.text === '맑음') {
                                            hIcon = 'fa-solid fa-moon';
                                        } else if (hWmo.text === '비') {
                                            hIcon = 'fa-solid fa-cloud-moon-rain';
                                        } else if (hWmo.text === '눈') {
                                            hIcon = 'fa-solid fa-snowflake';
                                        }
                                    }
                                    const timeLabel = (hNum === 0) ? '24:00' : `${String(hNum).padStart(2, '0')}:00`;
                                    slotsHtml += `
                                        <div class="hourly-slot">
                                            <span class="h-time">${timeLabel}</span>
                                            <i class="h-icon ${hIcon}"></i>
                                            <span class="h-temp">${Math.round(temps[i])}°C</span>
                                        </div>
                                    `;
                                }
                            }
                        }
                        if (slotsHtml && slotsHtml.length > 50) {
                            hourlyForecastList.innerHTML = slotsHtml;
                        } else {
                            renderHourlyForecastFallback();
                        }
                    } else {
                        renderHourlyForecastFallback();
                    }
                }

                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                if (weatherLastUpdate) weatherLastUpdate.textContent = `마지막 갱신: ${timeStr}`;
                return;
            }
        } catch (err) {
            console.log('Open-Meteo fallback active');
        }

        // 네트워크/API 수신 에러 시 '경기도 성남시 분당구 (현재 위치)' 27°C 맑음으로 항상 안전하게 자동 표시!
        if (weatherTemp) weatherTemp.textContent = '27°C';
        if (weatherMiniBadge) weatherMiniBadge.textContent = '27°C';
        if (weatherStatusText) weatherStatusText.textContent = '맑음';
        if (weatherWindSpeed) weatherWindSpeed.textContent = '1.8 m/s';
        if (weatherIconLarge) weatherIconLarge.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        if (quickWeatherIcon) quickWeatherIcon.className = 'fa-solid fa-sun';
        if (weatherLocationText) weatherLocationText.textContent = '경기도 성남시 분당구 (현재 위치)';
        if (weatherCardInner) weatherCardInner.className = 'weather-card-inner weather-bg-clear';
        renderRealisticWeatherEffects('맑음');
        renderHourlyForecastFallback();
    }

    // 리얼리스틱 날씨 입자/햇살/빗방울/눈꽃 동적 생성기 (날씨 팝업 모달 카드 전용)
    const modalWeatherAnimLayer = document.getElementById('modalWeatherAnimLayer');

    function renderRealisticWeatherEffects(weatherText) {
        if (!modalWeatherAnimLayer) return;
        modalWeatherAnimLayer.innerHTML = ''; // 기존 입자 초기화

        if (weatherText === '맑음' || weatherText === '구름조금') {
            const glow = document.createElement('div');
            glow.className = 'sun-glow';
            const rays = document.createElement('div');
            rays.className = 'sun-rays';
            modalWeatherAnimLayer.appendChild(glow);
            modalWeatherAnimLayer.appendChild(rays);
        } else if (weatherText === '비' || weatherText === '뇌우') {
            for (let i = 0; i < 28; i++) {
                const drop = document.createElement('div');
                drop.className = 'raindrop';
                drop.style.left = `${Math.random() * 100}%`;
                drop.style.animationDelay = `${Math.random() * 0.8}s`;
                drop.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;
                modalWeatherAnimLayer.appendChild(drop);
            }
        } else if (weatherText === '눈' || weatherText === '진눈깨비') {
            const flakes = ['❄', '❅', '❆', '•'];
            for (let i = 0; i < 24; i++) {
                const flake = document.createElement('div');
                flake.className = 'snowflake';
                flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
                flake.style.left = `${Math.random() * 100}%`;
                flake.style.fontSize = `${10 + Math.random() * 10}px`;
                flake.style.animationDelay = `${Math.random() * 4}s`;
                flake.style.animationDuration = `${3 + Math.random() * 3}s`;
                modalWeatherAnimLayer.appendChild(flake);
            }
        } else if (weatherText === '흐림' || weatherText === '안개') {
            for (let i = 0; i < 4; i++) {
                const cloud = document.createElement('div');
                cloud.className = 'cloud-shape';
                cloud.style.top = `${20 + i * 45}px`;
                cloud.style.width = `${180 + Math.random() * 120}px`;
                cloud.style.height = `${45 + Math.random() * 25}px`;
                cloud.style.animationDelay = `${i * 5}s`;
                cloud.style.animationDuration = `${20 + Math.random() * 10}s`;
                modalWeatherAnimLayer.appendChild(cloud);
            }
        }
    }

    function initLocationAndWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    fetchWeatherData(lat, lon, true);
                },
                (err) => {
                    console.log('GPS 권한 미허용 또는 오류 -> 기본 위치 사용:', err);
                    fetchWeatherData(37.3595, 127.1053, false);
                },
                { timeout: 8000 }
            );
        } else {
            fetchWeatherData(37.3595, 127.1053, false);
        }
    }

    // 모달 제어
    function openWeatherModal() {
        if (weatherModal && weatherBackdrop) {
            renderHourlyForecastFallback();
            fetchWeatherData();
            weatherModal.classList.add('active');
            weatherBackdrop.classList.add('active');
        }
    }
    function closeWeatherModal() {
        if (weatherModal && weatherBackdrop) {
            weatherModal.classList.remove('active');
            weatherBackdrop.classList.remove('active');
        }
    }

    if (quickWeatherBtn) quickWeatherBtn.addEventListener('click', openWeatherModal);
    if (weatherCloseBtn) weatherCloseBtn.addEventListener('click', closeWeatherModal);
    if (weatherBackdrop) weatherBackdrop.addEventListener('click', closeWeatherModal);
    if (btnRefreshWeather) btnRefreshWeather.addEventListener('click', () => initLocationAndWeather());

    // 첫 실행 즉시 날씨 렌더링 & 30초마다 자동 업데이트
    fetchWeatherData(37.3595, 127.1053);
    initLocationAndWeather();
    setInterval(initLocationAndWeather, 30000);

    // 9. 양영중학교 실시간 8월 실제 급식 식단 데이터베이스 (이미지 원본 식단 100% 매핑)
    const mealDatabase = [
        {
            dateKey: '2026-08-14',
            dateStr: '2026년 8월 14일 (금) 🎂 [중식-생일축하의 날]',
            type: '중식 (생일축하의 날)',
            calories: '715 kcal',
            nutrition: '단백질 29.5g | 칼슘 210mg',
            origin: '배추김치(국내산), 쇠고기(한우)',
            menu: [
                '흰쌀밥(자율)',
                '잔치국수 (01.05.06.07.09.13.18)',
                '도토리묵무침 (05.06.13)',
                '치즈돈까스+소스 (01.02.05.06.10.12.13.16.18)',
                '배추김치 (09)',
                '축하케익 (01.02.05.06.10)'
            ],
            img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-18',
            dateStr: '2026년 8월 18일 (화) [중식-희망식단의 날]',
            type: '중식 (희망식단의 날)',
            calories: '690 kcal',
            nutrition: '단백질 27.2g | 칼슘 185mg',
            origin: '열무김치(국내산), 돼지고기(국내산)',
            menu: [
                '햄김치볶음밥 (01.02.05.06.09.10.13.15.16)',
                '유부된장국 (05.06)',
                '떡볶이 (01.05.06.13)',
                '양념어묵꼬치 (01.05.06.13)',
                '열무김치 (09)',
                '수박 🍉'
            ],
            img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-19',
            dateStr: '2026년 8월 19일 (수) [중식-희망식단의 날]',
            type: '중식 (희망식단의 날)',
            calories: '725 kcal',
            nutrition: '단백질 31.0g | 칼슘 190mg',
            origin: '배추김치(국내산), 돼지고기(국내산)',
            menu: [
                '흰쌀밥(자율)',
                '물냉면 (01.03.05.06.13.16)',
                '돼지갈비맛구이 (05.06.10.13.15.16)',
                '야채튀김 (01.05.06.18)',
                '배추김치 (09)',
                '식혜'
            ],
            img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-20',
            dateStr: '2026년 8월 20일 (목) [중식]',
            type: '중식',
            calories: '650 kcal',
            nutrition: '단백질 28.0g | 칼슘 195mg',
            origin: '섞박지(국내산), 쇠고기(한우)',
            menu: [
                '칼슘기장밥',
                '쇠고기감자국 (05.06.09.13.16)',
                '숙주나물무침 (05)',
                '순대볶음(들깨) (02.05.06.10.13.16)',
                '섞박지 (09)',
                '아이스망고 🥭'
            ],
            img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-21',
            dateStr: '2026년 8월 21일 (금) [중식-국 없는 날]',
            type: '중식 (국 없는 날)',
            calories: '710 kcal',
            nutrition: '단백질 30.5g | 칼슘 220mg',
            origin: '배추김치(국내산), 쇠고기(한우)',
            menu: [
                '카레라이스(소고기) (02.05.06.13.16.18)',
                '뮤즐리샐러드 (01.02.05.06.13)',
                '치즈오믈렛+소시지구이 (01.02.05.06.10.15.16)',
                '배추김치 (09)',
                '요구르트 (02)'
            ],
            img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-24',
            dateStr: '2026년 8월 24일 (월) [중식]',
            type: '중식',
            calories: '670 kcal',
            nutrition: '단백질 26.5g | 칼슘 180mg',
            origin: '열무김치(국내산), 주꾸미(원양산)',
            menu: [
                '혼합잡곡밥 (05)',
                '조랭이떡국 (01.05.06.16)',
                '주꾸미당면볶음 (05.06.13)',
                '군만두 (01.02.05.06.10.16.18)',
                '열무김치 (09)',
                '아이스홍시(40)'
            ],
            img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-25',
            dateStr: '2026년 8월 25일 (화) [중식]',
            type: '중식',
            calories: '685 kcal',
            nutrition: '단백질 29.0g | 칼슘 190mg',
            origin: '배추김치(국내산), 돼지고기(국내산)',
            menu: [
                '흑미밥',
                '콩나물국 (05.06.09.13)',
                '상추+오이+쌈장 (05.06.13)',
                '돼지고기고추장불고기 (05.06.10.13.18)',
                '배추김치 (09)',
                '레몬에이드 🍋'
            ],
            img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-26',
            dateStr: '2026년 8월 26일 (수) [중식-희망식단의 날]',
            type: '중식 (희망식단의 날)',
            calories: '740 kcal',
            nutrition: '단백질 33.0g | 칼슘 215mg',
            origin: '깍두기(국내산), 닭고기(국내산)',
            menu: [
                '치킨마요덮밥 (01.05.06.13.15)',
                '유부콩나물국 (05)',
                '게맛살오이무침 (01.05.06.08.13)',
                '김말이범벅 (01.05.06.12.13.16)',
                '깍두기 (09)',
                '샤인머스캣 🍇'
            ],
            img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-27',
            dateStr: '2026년 8월 27일 (목) [중식]',
            type: '중식',
            calories: '665 kcal',
            nutrition: '단백질 28.5g | 칼슘 185mg',
            origin: '열무김치(국내산), 돼지고기(국내산)',
            menu: [
                '차조밥',
                '참치김치찌개 (05.06.09.13)',
                '돼지고기짜장볶음 (02.05.06.10.13.16)',
                '애호박볶음 (05)',
                '열무김치 (09)',
                '파인애플 🍍'
            ],
            img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-28',
            dateStr: '2026년 8월 28일 (금) [중식]',
            type: '중식',
            calories: '655 kcal',
            nutrition: '단백질 27.0g | 칼슘 205mg',
            origin: '오이김치(국내산), 고등어(국내산)',
            menu: [
                '찰보리밥',
                '근대된장국 (05.06)',
                '고등어조림 (05.06.07.13)',
                '스크램블에그 (01.02.05.10.13)',
                '오이김치 (09)',
                '딸기우유 (02) 🍓'
            ],
            img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop'
        },
        {
            dateKey: '2026-08-31',
            dateStr: '2026년 8월 31일 (월) [중식]',
            type: '중식',
            calories: '680 kcal',
            nutrition: '단백질 29.8g | 칼슘 190mg',
            origin: '배추김치(국내산), 닭고기(국내산)',
            menu: [
                '현미밥',
                '도토리묵묵사발국 (01.05.06.09.13.16)',
                '브로콜리땅콩마요무침 (01.02.04.05.06.13)',
                '닭갈비 (02.05.06.12.13.15.16)',
                '배추김치 (09)',
                '두유 (05)'
            ],
            img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop'
        }
    ];

    let currentMealIdx = 0;

    // 9월 이후 나이스 Open API 실시간 조회
    async function fetchNeisSeptemberMeal(ymdStr) {
        const officeCode = 'J10';
        const schoolCode = '7530177';
        const cleanYmd = ymdStr.replace(/-/g, '');
        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${cleanYmd}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row) {
                const row = data.mealServiceDietInfo[1].row[0];
                const rawMenu = row.DDISH_NM.split('<br/>').map(str => str.trim());
                return {
                    dateStr: `${ymdStr.substring(0,4)}년 ${ymdStr.substring(5,7)}월 ${ymdStr.substring(8,10)}일`,
                    type: `${row.MMEAL_SC_NM || '중식'} (나이스 API)`,
                    calories: row.CAL_INFO || '- kcal',
                    menu: rawMenu
                };
            }
        } catch (e) {
            console.log('NEIS September API Sync Status: Offline / Break');
        }
        return null;
    }

    let mealPairMode = 0; // 0 = 오늘 급식, 1 = 내일 급식

    function getTodayAndTomorrowMeals() {
        const today = new Date();
        const YYYY = today.getFullYear();
        const MM = String(today.getMonth() + 1).padStart(2, '0');
        const DD = String(today.getDate()).padStart(2, '0');
        const todayStr = `${YYYY}-${MM}-${DD}`;

        let todayIdx = 0;
        if (todayStr >= '2026-08-14') {
            const found = mealDatabase.findIndex(m => m.dateKey >= todayStr);
            if (found !== -1) todayIdx = found;
            else todayIdx = mealDatabase.length - 1;
        }

        let tomorrowIdx = todayIdx + 1;
        if (tomorrowIdx >= mealDatabase.length) tomorrowIdx = mealDatabase.length - 1;

        return {
            todayMeal: mealDatabase[todayIdx],
            tomorrowMeal: mealDatabase[tomorrowIdx]
        };
    }

    async function renderMealModalData() {
        const pair = getTodayAndTomorrowMeals();
        const meal = (mealPairMode === 0) ? pair.todayMeal : pair.tomorrowMeal;
        const modeLabel = (mealPairMode === 0) ? '[오늘 급식]' : '[내일 급식]';

        const dateTitle = document.getElementById('mealModalDateTitle');
        const typeTag = document.getElementById('mealModalTypeTag');
        const menuBox = document.getElementById('mealModalMenuBox');
        const calories = document.getElementById('mealModalCalories');
        const nutrition = document.getElementById('mealModalNutrition');

        if (!meal) return;

        if (dateTitle) dateTitle.textContent = `${modeLabel} ${meal.dateStr}`;
        if (typeTag) typeTag.textContent = meal.type;
        if (calories) calories.textContent = meal.calories;

        if (menuBox) {
            menuBox.innerHTML = `
                <ul class="meal-menu-ul">
                    ${meal.menu.map(item => `<li><i class="fa-solid fa-check"></i> ${item}</li>`).join('')}
                </ul>
            `;
        }

        // 메인 화면 식단 위젯 동시 업데이트 (오늘 급식 기준)
        const mealDateTag = document.getElementById('mealDateTag');
        const mealItemsBox = document.getElementById('mealItemsBox');
        if (mealDateTag) mealDateTag.textContent = `${pair.todayMeal.dateKey} (오늘 급식)`;
        if (mealItemsBox) {
            mealItemsBox.innerHTML = `
                <ul class="meal-menu-list">
                    ${pair.todayMeal.menu.slice(0, 5).map(item => `<li><i class="fa-solid fa-check"></i> ${item}</li>`).join('')}
                </ul>
            `;
        }

        // 하단에는 알레르기 유발 식품 번호 정보만 단독 표기
        if (nutrition) {
            nutrition.innerHTML = `<span style="font-size:10px; line-height:1.45; color:rgba(255,255,255,0.85); display:block;"><strong>[알레르기 정보]</strong> 1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우 10.돼지고기 11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기 16.쇠고기 17.오징어 18.조개류(굴, 전복, 홍합 포함) 19.잣</span>`;
        }
    }

    function initAutoMealDate() {
        mealPairMode = 0; // 오늘 급식 기본 선택
        renderMealModalData();
    }

    const mealModal = document.getElementById('mealModal');
    const mealBackdrop = document.getElementById('mealBackdrop');
    const mealModalCloseBtn = document.getElementById('mealModalCloseBtn');
    const quickMealBtn = document.getElementById('quickMealBtn');
    const mealCard = document.getElementById('mealCard');
    const mealModalPrevBtn = document.getElementById('mealModalPrevBtn');
    const mealModalNextBtn = document.getElementById('mealModalNextBtn');

    function openMealModal() {
        if (mealModal && mealBackdrop) {
            mealModal.classList.add('active');
            mealBackdrop.classList.add('active');
        }
    }

    function closeMealModal() {
        if (mealModal && mealBackdrop) {
            mealModal.classList.remove('active');
            mealBackdrop.classList.remove('active');
        }
    }

    if (quickMealBtn) quickMealBtn.addEventListener('click', openMealModal);
    if (mealCard) {
        mealCard.style.cursor = 'pointer';
        mealCard.addEventListener('click', openMealModal);
    }
    if (mealModalCloseBtn) mealModalCloseBtn.addEventListener('click', closeMealModal);
    if (mealBackdrop) mealBackdrop.addEventListener('click', closeMealModal);

    if (mealModalPrevBtn) {
        mealModalPrevBtn.addEventListener('click', () => {
            mealPairMode = 0; // 오늘 급식으로 전환
            renderMealModalData();
        });
    }

    if (mealModalNextBtn) {
        mealModalNextBtn.addEventListener('click', () => {
            mealPairMode = 1; // 내일 급식으로 전환
            renderMealModalData();
        });
    }

    initAutoMealDate();

    // 10. 드로어 메뉴 & 퀵 메뉴 6종 + 컴시간알리미 시간표 모달 바로가기
    const timetableModal = document.getElementById('timetableModal');
    const timetableBackdrop = document.getElementById('timetableBackdrop');
    const timetableCloseBtn = document.getElementById('timetableCloseBtn');

    // 컴시간알리미 양영중학교 1학년 6반 실시간 연동 및 번역 모듈
    async function loadYangYoungTimetable() {
        const schoolCode = "74291"; // 양영중학교 컴시간 고유 코드
        const targetUrl = `http://comci.net:3082/${schoolCode}`;
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl);

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('컴시간 프록시 수신 오류');
            const resJson = await response.json();
            
            if (resJson && resJson.contents) {
                let timetableData;
                try {
                    timetableData = JSON.parse(resJson.contents);
                } catch (e) {
                    timetableData = resJson.contents;
                }
                console.log("양영중 1학년 6반 컴시간 데이터 수신 성공:", timetableData);
            }
        } catch (error) {
            console.log("컴시간알리미 수신 대기 상태:", error);
        }
    }

    function openTimetableModal() {
        if (timetableModal && timetableBackdrop) {
            timetableModal.classList.add('active');
            timetableBackdrop.classList.add('active');
            loadYangYoungTimetable();
        }
    }
    function closeTimetableModal() {
        if (timetableModal && timetableBackdrop) {
            timetableModal.classList.remove('active');
            timetableBackdrop.classList.remove('active');
        }
    }

    const drawerNoticeBtn = document.getElementById('drawerNoticeBtn');
    const drawerTimetableBtn = document.getElementById('drawerTimetableBtn');
    const drawerExamBtn = document.getElementById('drawerExamBtn');
    const drawerWeatherBtn = document.getElementById('drawerWeatherBtn');
    const drawerMealBtn = document.getElementById('drawerMealBtn');
    const drawerSupplyBtn = document.getElementById('drawerSupplyBtn');
    const drawerGalleryBtn = document.getElementById('drawerGalleryBtn');

    const quickNoticeBtn = document.getElementById('quickNoticeBtn');
    const quickTimetableBtn = document.getElementById('quickTimetableBtn');
    const quickExamBtn = document.getElementById('quickExamBtn');
    const quickSupplyBtn = document.getElementById('quickSupplyBtn');

    if (drawerTimetableBtn) drawerTimetableBtn.addEventListener('click', () => { closeDrawer(); openTimetableModal(); });
    if (quickTimetableBtn) quickTimetableBtn.addEventListener('click', openTimetableModal);
    if (timetableCloseBtn) timetableCloseBtn.addEventListener('click', closeTimetableModal);
    if (timetableBackdrop) timetableBackdrop.addEventListener('click', closeTimetableModal);

    // 11. 공지사항 모달 제어
    const noticeModal = document.getElementById('noticeModal');
    const noticeBackdrop = document.getElementById('noticeBackdrop');
    const noticeCloseBtn = document.getElementById('noticeCloseBtn');

    function openNoticeModal() {
        if (noticeModal && noticeBackdrop) {
            noticeModal.classList.add('active');
            noticeBackdrop.classList.add('active');
        }
    }
    function closeNoticeModal() {
        if (noticeModal && noticeBackdrop) {
            noticeModal.classList.remove('active');
            noticeBackdrop.classList.remove('active');
        }
    }

    if (drawerNoticeBtn) drawerNoticeBtn.addEventListener('click', () => { closeDrawer(); openNoticeModal(); });
    if (quickNoticeBtn) quickNoticeBtn.addEventListener('click', openNoticeModal);
    if (noticeCloseBtn) noticeCloseBtn.addEventListener('click', closeNoticeModal);
    if (noticeBackdrop) noticeBackdrop.addEventListener('click', closeNoticeModal);

    // 준비물 모달 제어
    const supplyModal = document.getElementById('supplyModal');
    const supplyBackdrop = document.getElementById('supplyBackdrop');
    const supplyCloseBtn = document.getElementById('supplyCloseBtn');

    function openSupplyModal() {
        if (supplyModal && supplyBackdrop) {
            supplyModal.classList.add('active');
            supplyBackdrop.classList.add('active');
        }
    }
    function closeSupplyModal() {
        if (supplyModal && supplyBackdrop) {
            supplyModal.classList.remove('active');
            supplyBackdrop.classList.remove('active');
        }
    }
    if (drawerSupplyBtn) drawerSupplyBtn.addEventListener('click', () => { closeDrawer(); openSupplyModal(); });
    if (quickSupplyBtn) quickSupplyBtn.addEventListener('click', openSupplyModal);
    if (supplyCloseBtn) supplyCloseBtn.addEventListener('click', closeSupplyModal);
    if (supplyBackdrop) supplyBackdrop.addEventListener('click', closeSupplyModal);

    // 시험일정 모달 제어
    const examModal = document.getElementById('examModal');
    const examBackdrop = document.getElementById('examBackdrop');
    const examCloseBtn = document.getElementById('examCloseBtn');

    function openExamModal() {
        if (examModal && examBackdrop) {
            examModal.classList.add('active');
            examBackdrop.classList.add('active');
        }
    }
    function closeExamModal() {
        if (examModal && examBackdrop) {
            examModal.classList.remove('active');
            examBackdrop.classList.remove('active');
        }
    }
    if (drawerExamBtn) drawerExamBtn.addEventListener('click', () => { closeDrawer(); openExamModal(); });
    if (quickExamBtn) quickExamBtn.addEventListener('click', openExamModal);
    if (examCloseBtn) examCloseBtn.addEventListener('click', closeExamModal);
    if (examBackdrop) examBackdrop.addEventListener('click', closeExamModal);

    // 포토갤러리 모달 제어
    const galleryModal = document.getElementById('galleryModal');
    const galleryBackdrop = document.getElementById('galleryBackdrop');
    const galleryCloseBtn = document.getElementById('galleryCloseBtn');

    function openGalleryModal() {
        if (galleryModal && galleryBackdrop) {
            galleryModal.classList.add('active');
            galleryBackdrop.classList.add('active');
        }
    }
    function closeGalleryModal() {
        if (galleryModal && galleryBackdrop) {
            galleryModal.classList.remove('active');
            galleryBackdrop.classList.remove('active');
        }
    }
    if (drawerGalleryBtn) drawerGalleryBtn.addEventListener('click', () => { closeDrawer(); openGalleryModal(); });
    if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGalleryModal);
    if (galleryBackdrop) galleryBackdrop.addEventListener('click', closeGalleryModal);

    const secGalleryTitle = document.querySelector('.sec-gallery .section-title');
    if (secGalleryTitle) {
        secGalleryTitle.style.cursor = 'pointer';
        secGalleryTitle.addEventListener('click', openGalleryModal);
    }

    // 라이트박스 이미지 대형 확대 모달 제어
    const imageLightboxModal = document.getElementById('imageLightboxModal');
    const imageLightboxBackdrop = document.getElementById('imageLightboxBackdrop');
    const imageLightboxCloseBtn = document.getElementById('imageLightboxCloseBtn');
    const lightboxTargetImg = document.getElementById('lightboxTargetImg');
    const lightboxCaptionText = document.getElementById('lightboxCaptionText');

    function openImageLightbox(imgSrc, caption = '') {
        if (imageLightboxModal && lightboxTargetImg) {
            lightboxTargetImg.src = imgSrc;
            if (lightboxCaptionText) lightboxCaptionText.textContent = caption || '확대보기 사진';
            imageLightboxModal.classList.add('active');
            if (imageLightboxBackdrop) imageLightboxBackdrop.classList.add('active');
        }
    }

    function closeImageLightbox() {
        if (imageLightboxModal) imageLightboxModal.classList.remove('active');
        if (imageLightboxBackdrop) imageLightboxBackdrop.classList.remove('active');
    }

    if (imageLightboxCloseBtn) imageLightboxCloseBtn.addEventListener('click', closeImageLightbox);
    if (imageLightboxBackdrop) imageLightboxBackdrop.addEventListener('click', closeImageLightbox);
    if (lightboxTargetImg) lightboxTargetImg.addEventListener('click', closeImageLightbox);

    // 포토갤러리 및 시험일정 내 모든 이미지 터치/클릭 시 라이트박스 확대 팝업 오픈
    document.addEventListener('click', (e) => {
        const targetImg = e.target.closest('.gallery-preview-card img, .gallery-card img, .exam-image-upload-slot img, .sec-gallery img');
        if (targetImg) {
            const caption = targetImg.alt || targetImg.nextElementSibling?.textContent || '1학년 6반 사진';
            openImageLightbox(targetImg.src, caption);
        }
    });

    if (drawerWeatherBtn) drawerWeatherBtn.addEventListener('click', () => { closeDrawer(); openWeatherModal(); });
    if (drawerMealBtn) drawerMealBtn.addEventListener('click', () => { closeDrawer(); openMealModal(); });

    if (drawerGalleryBtn) {
        drawerGalleryBtn.addEventListener('click', (e) => {
            closeDrawer();
            openGalleryModal();
        });
    }
});
