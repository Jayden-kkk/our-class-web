/* ==========================================================================
   준우(junwoo) 바탕화면 모바일 웹 포털 JS 로직 및 실시간 커스터마이저
   ========================================================================== */

function initApp() {

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

        const monthEvents = [...(schoolEventsData[calCurrentMonth] || [])];

        // 어드민에 등록된 활성 시험일정 날짜를 학사일정 및 달력 점(Dot)으로 자동 연동
        try {
            const savedExamList = JSON.parse(localStorage.getItem('app_exam_list') || 'null');
            const examList = (savedExamList && Array.isArray(savedExamList)) ? savedExamList : null;
            if (examList) {
                examList.forEach(ex => {
                    if (ex.active !== false && ex.targetDate) {
                        const parts = ex.targetDate.split('-');
                        if (parts.length === 3) {
                            const exYear = parseInt(parts[0], 10);
                            const exMonth = parseInt(parts[1], 10) - 1;
                            const exDay = parseInt(parts[2], 10);
                            if (exYear === calCurrentYear && exMonth === calCurrentMonth) {
                                monthEvents.push({
                                    day: exDay,
                                    date: `${exMonth + 1}.${exDay}`,
                                    name: `📝 [시험] ${ex.title}`,
                                    color: 'orange'
                                });
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }

        const eventDays = monthEvents.map(e => e.day);

        let gridHtml = '';
        for (let i = 0; i < firstDayIndex; i++) {
            gridHtml += `<div class="cal-day-cell empty">&nbsp;</div>`;
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

        // 5주/6주에 관계없이 항상 6개 행(42개 셀) 고정 렌더링으로 높이 고정
        const filledCells = firstDayIndex + totalDays;
        for (let i = filledCells; i < 42; i++) {
            gridHtml += `<div class="cal-day-cell empty">&nbsp;</div>`;
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
                            <span class="event-name" title="${evt.name.replace(/"/g, '&quot;')}">${evt.name}</span>
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
    window.changeHeroCalMonth = function (dir) {
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

    // 2-1. 커스터마이저 설정 적용 헬퍼
    function applyCustomizerConfig(config) {
        if (!config) return;

        if (config.viewMode) {
            const viewButtons = document.querySelectorAll('.btn-option[data-view]');
            viewButtons.forEach(b => {
                if (b.getAttribute('data-view') === config.viewMode) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            if (config.viewMode === 'full') {
                document.body.classList.remove('mode-frame');
                document.body.classList.add('mode-full');
            } else {
                document.body.classList.remove('mode-full');
                document.body.classList.add('mode-frame');
            }
        }

        if (config.theme) {
            const colorButtons = document.querySelectorAll('.color-btn[data-theme]');
            colorButtons.forEach(b => {
                if (b.getAttribute('data-theme') === config.theme) {
                    b.classList.add('active');
                    b.style.border = '2px solid #fff';
                } else {
                    b.classList.remove('active');
                    b.style.border = '2px solid transparent';
                }
            });
            document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
            document.body.classList.add(config.theme);
        }

        if (config.schoolName) {
            const inputSchoolName = document.getElementById('inputSchoolName');
            const displaySchoolName = document.getElementById('displaySchoolName');
            const drawerSchoolTitle = document.getElementById('drawerSchoolTitle');

            if (inputSchoolName) inputSchoolName.value = config.schoolName;
            if (displaySchoolName) displaySchoolName.textContent = config.schoolName;
            if (drawerSchoolTitle) drawerSchoolTitle.textContent = config.schoolName;
            document.title = `${config.schoolName} - 양영중 1-6 알리미`;
        }

        if (Array.isArray(config.hiddenSections)) {
            const sectionToggles = document.querySelectorAll('.section-toggle');
            sectionToggles.forEach(toggle => {
                const targetId = toggle.getAttribute('data-target');
                const isHidden = config.hiddenSections.includes(targetId);
                toggle.checked = !isHidden;

                const sec = document.getElementById(targetId);
                if (sec) {
                    if (isHidden) sec.classList.add('hidden');
                    else sec.classList.remove('hidden');
                }
            });
        }
    }

    // 2-2. 미리보기 형태 스위치 (프레임 뷰 vs 전체화면)
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

    // 2-3. 테마 컬러 스위치
    const colorButtons = document.querySelectorAll('.color-btn[data-theme]');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => {
                b.classList.remove('active');
                b.style.border = '2px solid transparent';
            });
            btn.classList.add('active');
            btn.style.border = '2px solid #fff';
            const themeClass = btn.getAttribute('data-theme');
            document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
            document.body.classList.add(themeClass);
        });
    });

    // 2-4. 학교 / 기관 명칭 실시간 동기화
    const inputSchoolName = document.getElementById('inputSchoolName');
    const displaySchoolName = document.getElementById('displaySchoolName');
    const drawerSchoolTitle = document.getElementById('drawerSchoolTitle');

    if (inputSchoolName) {
        inputSchoolName.addEventListener('input', (e) => {
            const val = e.target.value || '학교명칭';
            if (displaySchoolName) displaySchoolName.textContent = val;
            if (drawerSchoolTitle) drawerSchoolTitle.textContent = val;
            document.title = `${val} - 양영중 1-6 알리미`;
        });
    }

    // 2-5. 섹션 표시 / 숨기기 (ON/OFF) 토글
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

    // 2-6. 화면 커스텀 설정 폼 저장 및 클라우드 DB 연동
    const adminCustomizerForm = document.getElementById('adminCustomizerForm');
    if (adminCustomizerForm) {
        adminCustomizerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const activeViewBtn = document.querySelector('.btn-option[data-view].active');
                const activeColorBtn = document.querySelector('.color-btn[data-theme].active');
                const inputSchoolName = document.getElementById('inputSchoolName');

                const viewMode = activeViewBtn ? activeViewBtn.getAttribute('data-view') : 'full';
                const theme = activeColorBtn ? activeColorBtn.getAttribute('data-theme') : 'theme-green';
                const schoolName = inputSchoolName?.value.trim() || '1학년 6반 알리미';

                const hiddenSections = [];
                document.querySelectorAll('.section-toggle').forEach(toggle => {
                    if (!toggle.checked) {
                        const targetId = toggle.getAttribute('data-target');
                        if (targetId) hiddenSections.push(targetId);
                    }
                });

                const config = { viewMode, theme, schoolName, hiddenSections };

                await saveToRemoteAndLocal('app_customizer_config', config);
                applyCustomizerConfig(config);

                alert('✅ 화면 커스텀 설정이 성공적으로 저장되어 메인 포털과 모든 화면에 완벽하게 반영되었습니다!');
            } catch (err) {
                console.error('Customizer Form Error:', err);
                alert(`⚠️ 화면 커스텀 저장 중 오류가 발생했습니다: ${err.message}`);
            }
        });
    }

    // 초기 설정 적용 및 실시간 클라우드 DB 구독
    try {
        const savedConfig = JSON.parse(localStorage.getItem('app_customizer_config') || 'null');
        if (savedConfig) {
            applyCustomizerConfig(savedConfig);
        }
    } catch (e) {}

    setupRemoteSync('app_customizer_config', (remoteData) => {
        if (remoteData) {
            applyCustomizerConfig(remoteData);
        }
    });

    // 2-7. 초기화 버튼
    const btnResetConfig = document.getElementById('btnResetConfig');
    if (btnResetConfig) {
        btnResetConfig.addEventListener('click', async () => {
            if (inputSchoolName) {
                inputSchoolName.value = '1학년 6반 알리미';
                inputSchoolName.dispatchEvent(new Event('input'));
            }
            colorButtons[0].click();
            viewButtons[0].click();
            sectionToggles.forEach(t => {
                t.checked = true;
                t.dispatchEvent(new Event('change'));
            });

            const defaultConfig = {
                viewMode: 'full',
                theme: 'theme-green',
                schoolName: '1학년 6반 알리미',
                hiddenSections: []
            };
            await saveToRemoteAndLocal('app_customizer_config', defaultConfig);
            applyCustomizerConfig(defaultConfig);
        });
    }

    // 3. 사이드 드로어 메뉴 (Drawer Nav)
    const drawerOpenBtn = document.getElementById('drawerOpenBtn');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerMenu = document.getElementById('drawerMenu');
    const drawerBackdrop = document.getElementById('drawerBackdrop');

    function openDrawer() {
        pauseAllBackgroundTimers();
        requestAnimationFrame(() => {
            drawerMenu.classList.add('active');
            drawerBackdrop.classList.add('active');
        });
    }
    function closeDrawer() {
        drawerMenu.classList.remove('active');
        drawerBackdrop.classList.remove('active');
        resumeAllBackgroundTimers();
    }

    if (drawerOpenBtn) drawerOpenBtn.addEventListener('click', openDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    // 5. 메인 비주얼 배너 (Hero Carousel Slider)
    const heroCarousel = document.getElementById('heroCarousel');
    const heroSlides = document.querySelectorAll('.carousel-slide');
    const heroDots = document.querySelectorAll('.hero-dots .dot');
    const heroCurrentSlide = document.getElementById('heroCurrentSlide');
    const heroPlayPauseBtn = document.getElementById('heroPlayPauseBtn');
    let heroIndex = 0;
    let heroTimer = null;
    let heroAutoPlay = true; // 사용자 지정 플레이/일시정지 토글 상태

    function restartHeroProgress() {
        if (!heroCarousel) return;
        const activeProgress = heroCarousel.querySelector('.hero-dots .dot.active .dot-progress');
        if (activeProgress) {
            activeProgress.style.animation = 'none';
            void activeProgress.offsetHeight; // Reflow 트리거로 프로그레스 리셋
            activeProgress.style.animation = '';
        }
    }

    function gotoHeroSlide(idx) {
        heroSlides.forEach(s => s.classList.remove('active'));
        heroDots.forEach(d => d.classList.remove('active'));

        heroIndex = (idx + heroSlides.length) % heroSlides.length;
        heroSlides[heroIndex].classList.add('active');
        if (heroDots[heroIndex]) heroDots[heroIndex].classList.add('active');
        if (heroCurrentSlide) heroCurrentSlide.textContent = heroIndex + 1;

        restartHeroProgress();
    }

    function startHeroTimer() {
        stopHeroTimer();
        if (!heroAutoPlay) return;
        if (heroCarousel) {
            heroCarousel.classList.add('is-playing');
            heroCarousel.classList.remove('is-paused');
        }
        heroTimer = setInterval(() => {
            gotoHeroSlide(heroIndex + 1);
        }, 4000);
    }

    function stopHeroTimer() {
        if (heroTimer) clearInterval(heroTimer);
        if (heroCarousel) {
            heroCarousel.classList.remove('is-playing');
            heroCarousel.classList.add('is-paused');
        }
    }

    let modalCloseTimer = null;

    // 팝업/모달 오픈 시 배경 롤링 타이머 일시 정지 (배경 롤링으로 인한 깜빡임 100% 원천 차단)
    function pauseAllBackgroundTimers() {
        if (modalCloseTimer) {
            clearTimeout(modalCloseTimer);
            modalCloseTimer = null;
        }
        stopHeroTimer();
        if (typeof stopPopupTimer === 'function') stopPopupTimer();
        document.body.classList.add('modal-open');
    }

    function resumeAllBackgroundTimers() {
        if (modalCloseTimer) clearTimeout(modalCloseTimer);
        // 모달 닫힘 CSS 애니메이션(300ms)이 완전히 끝난 후 배경 롤링 및 트랜지션 해제 (닫을 때 깜빡임 완전 차단)
        modalCloseTimer = setTimeout(() => {
            const activeModal = document.querySelector('.notice-modal.active, .timetable-modal.active, .supply-modal.active, .exam-modal.active, .gallery-modal.active, .weather-modal.active, .meal-modal.active, .lightbox-modal.active, .drawer-menu.active, .admin-modal.active');
            if (!activeModal) {
                startHeroTimer();
                if (typeof startPopupTimer === 'function') startPopupTimer();
                document.body.classList.remove('modal-open');
            }
        }, 320);
    }

    if (heroPlayPauseBtn) {
        heroPlayPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            heroAutoPlay = !heroAutoPlay;
            const icon = heroPlayPauseBtn.querySelector('i');
            if (heroAutoPlay) {
                if (icon) icon.className = 'fa-solid fa-pause';
                startHeroTimer();
            } else {
                if (icon) icon.className = 'fa-solid fa-play';
                stopHeroTimer();
            }
        });
    }

    heroDots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            gotoHeroSlide(index);
            if (heroAutoPlay) {
                startHeroTimer();
            }
        });
    });

    startHeroTimer();

    // 5-1. 손가락 좌우 스와이프 & 마우스 드래그 포인터 이벤트 통합 지원
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
    function stopPopupTimer() {
        if (popupTimer) clearInterval(popupTimer);
    }

    // 팝업/모달 오픈 시 배경 롤링 타이머 일시 정지 (배경 롤링으로 인한 깜빡임 100% 원천 차단)
    function pauseAllBackgroundTimers() {
        stopHeroTimer();
        stopPopupTimer();
        document.body.classList.add('modal-open');
    }

    function resumeAllBackgroundTimers() {
        const activeModal = document.querySelector('.notice-modal.active, .timetable-modal.active, .supply-modal.active, .exam-modal.active, .gallery-modal.active, .weather-modal.active, .meal-modal.active, .lightbox-modal.active, .drawer-menu.active, .admin-modal.active');
        if (!activeModal) {
            startHeroTimer();
            startPopupTimer();
            document.body.classList.remove('modal-open');
        }
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

    let cachedLat = 37.3595;
    let cachedLon = 127.1053;
    let cachedLocText = '현재 위치 확인 중...';

    async function updateLocationName(lat, lon) {
        // 1차: BigDataCloud Reverse Geocoding API
        try {
            const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`);
            if (resp.ok) {
                const data = await resp.json();
                const region = data.principalSubdivision || '';
                const city = data.city || data.locality || '';
                if (region || city) {
                    cachedLocText = `${region} ${city} (현재 위치)`.trim();
                    if (weatherLocationText) weatherLocationText.textContent = cachedLocText;
                    return;
                }
            }
        } catch (e) { }

        // 2차: Nominatim OpenStreetMap Reverse Geocoding API
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ko`);
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.address) {
                    const prov = data.address.province || data.address.state || '';
                    const city = data.address.city || data.address.borough || data.address.county || data.address.suburb || '';
                    if (prov || city) {
                        cachedLocText = `${prov} ${city} (현재 위치)`.trim();
                        if (weatherLocationText) weatherLocationText.textContent = cachedLocText;
                        return;
                    }
                }
            }
        } catch (e) { }

        cachedLocText = '현재 위치';
        if (weatherLocationText) weatherLocationText.textContent = cachedLocText;
    }

    async function fetchWeatherData(lat = cachedLat, lon = cachedLon, customLocText = null) {
        const displayLoc = customLocText || cachedLocText;

        // 즉시 기본값 및 시간별 예보 렌더링
        if (weatherTemp) weatherTemp.textContent = '27°C';
        if (weatherMiniBadge) weatherMiniBadge.textContent = '27°C';
        if (weatherStatusText) weatherStatusText.textContent = '맑음';
        if (weatherWindSpeed) weatherWindSpeed.textContent = '1.8 m/s';
        if (weatherIconLarge) weatherIconLarge.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        if (quickWeatherIcon) quickWeatherIcon.className = 'fa-solid fa-sun';
        if (weatherLocationText) weatherLocationText.textContent = displayLoc;
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
                if (weatherLocationText) weatherLocationText.textContent = displayLoc;

                // 아이콘 및 배경 업데이트
                if (weatherIconLarge) weatherIconLarge.innerHTML = `<i class="${wmoInfo.icon}"></i>`;
                if (quickWeatherIcon) quickWeatherIcon.className = wmoInfo.icon;

                if (weatherCardInner) {
                    weatherCardInner.className = `weather-card-inner ${wmoInfo.bg}`;
                }

                // 모달 및 전체 앱에 리얼리스틱 날씨 배경 이펙트 적용
                renderRealisticWeatherEffects(wmoInfo.text);

                // 미세먼지 수치 실시간 연동
                updateAirQuality(lat, lon);

                // 08:00 ~ 24:00 시간별 예보 생성
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

        // 수신 에러 시 안전 자동 표시
        if (weatherTemp) weatherTemp.textContent = '27°C';
        if (weatherMiniBadge) weatherMiniBadge.textContent = '27°C';
        if (weatherStatusText) weatherStatusText.textContent = '맑음';
        if (weatherWindSpeed) weatherWindSpeed.textContent = '1.8 m/s';
        if (weatherIconLarge) weatherIconLarge.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        if (quickWeatherIcon) quickWeatherIcon.className = 'fa-solid fa-sun';
        if (weatherLocationText) weatherLocationText.textContent = displayLoc;
        if (weatherCardInner) weatherCardInner.className = 'weather-card-inner weather-bg-clear';
        renderRealisticWeatherEffects('맑음');
        renderHourlyForecastFallback();
    }

    // 리얼리스틱 날씨 입자/햇살/빗방울/눈꽃 동적 생성기 (날씨 팝업 모달 카드 전용)
    const modalWeatherAnimLayer = document.getElementById('modalWeatherAnimLayer');

    function renderRealisticWeatherEffects(weatherText) {
        if (!modalWeatherAnimLayer) return;
        modalWeatherAnimLayer.innerHTML = '';

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

    async function updateAirQuality(lat, lon) {
        const weatherDustLevel = document.getElementById('weatherDustLevel');
        if (!weatherDustLevel) return;

        try {
            const resp = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5`);
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.current) {
                    const pm10 = data.current.pm10 || 15;
                    if (pm10 <= 30) {
                        weatherDustLevel.className = 'dust-pill dust-good';
                        weatherDustLevel.innerHTML = `<i class="fa-solid fa-face-laugh-beam"></i> 좋음`;
                    } else if (pm10 <= 80) {
                        weatherDustLevel.className = 'dust-pill dust-normal';
                        weatherDustLevel.innerHTML = `<i class="fa-solid fa-face-meh"></i> 보통`;
                    } else if (pm10 <= 150) {
                        weatherDustLevel.className = 'dust-pill dust-bad';
                        weatherDustLevel.innerHTML = `<i class="fa-solid fa-face-frown"></i> 나쁨`;
                    } else {
                        weatherDustLevel.className = 'dust-pill dust-vbad';
                        weatherDustLevel.innerHTML = `<i class="fa-solid fa-face-angry"></i> 매우나쁨`;
                    }
                    return;
                }
            }
        } catch (e) { }

        weatherDustLevel.className = 'dust-pill dust-good';
        weatherDustLevel.innerHTML = `<i class="fa-solid fa-face-laugh-beam"></i> 좋음`;
    }

    async function fetchIpLocationFallback() {
        try {
            const resp = await fetch('https://ipapi.co/json/');
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.latitude && data.longitude) {
                    cachedLat = data.latitude;
                    cachedLon = data.longitude;
                    const regionName = data.region || '';
                    const cityName = data.city || '';
                    const locName = `${regionName} ${cityName} (현재 위치)`.trim() || '현재 위치';
                    cachedLocText = locName;
                    fetchWeatherData(cachedLat, cachedLon, cachedLocText);
                    return true;
                }
            }
        } catch (e) { }
        return false;
    }

    function initLocationAndWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    cachedLat = pos.coords.latitude;
                    cachedLon = pos.coords.longitude;
                    await updateLocationName(cachedLat, cachedLon);
                    fetchWeatherData(cachedLat, cachedLon);
                },
                async (err) => {
                    console.log('GPS 권한 미허용 또는 오류 -> IP 기반 위치 자동 확인 시도:', err);
                    const ipSuccess = await fetchIpLocationFallback();
                    if (!ipSuccess) {
                        fetchWeatherData(cachedLat, cachedLon, '내 위치 (GPS 기반)');
                    }
                },
                { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
            );
        } else {
            fetchIpLocationFallback().then(ipSuccess => {
                if (!ipSuccess) {
                    fetchWeatherData(cachedLat, cachedLon, '내 위치 (GPS 기반)');
                }
            });
        }
    }

    // 모달 제어
    function openWeatherModal() {
        if (weatherModal && weatherBackdrop) {
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                weatherModal.classList.add('active');
                weatherBackdrop.classList.add('active');
            });
        }
    }
    function closeWeatherModal() {
        if (weatherModal && weatherBackdrop) {
            weatherModal.classList.remove('active');
            weatherBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
        }
    }

    if (quickWeatherBtn) quickWeatherBtn.addEventListener('click', openWeatherModal);
    if (weatherCloseBtn) weatherCloseBtn.addEventListener('click', closeWeatherModal);
    if (weatherBackdrop) weatherBackdrop.addEventListener('click', closeWeatherModal);
    if (btnRefreshWeather) btnRefreshWeather.addEventListener('click', () => initLocationAndWeather());

    // 메인 날씨 카드가 존재하는 학생 포털(index.html)에서만 1회 위치 GPS 권한 확인 및 날씨 갱신 (admin.html 에서는 불필요한 위치 권한 팝업 차단)
    if (document.getElementById('weatherCardInner') || document.getElementById('weatherTemp')) {
        initLocationAndWeather();
        setInterval(() => fetchWeatherData(cachedLat, cachedLon), 600000);
    }

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
                    dateStr: `${ymdStr.substring(0, 4)}년 ${ymdStr.substring(5, 7)}월 ${ymdStr.substring(8, 10)}일`,
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

        let fullStr = `${modeLabel} ${meal.dateStr}`;
        // 요일 ')' 뒤에서 내려쓰기하여 깔끔하게 2줄로 분리 렌더링 (포인트 골드 옐로우 #fde047 연동)
        const match = fullStr.match(/^(.*?\)\s*)(.*)$/);
        if (match && match[2].trim()) {
            if (dateTitle) {
                dateTitle.innerHTML = `<span style="display:block; font-size:12.5px; color:#ffffff; font-weight:700;">${match[1].trim()}</span><span style="display:block; font-size:11.5px; color:#fde047; margin-top:3px; font-weight:700;">${match[2].trim()}</span>`;
            }
        } else {
            if (dateTitle) dateTitle.innerHTML = `<span style="display:block; font-size:12.5px; color:#ffffff; font-weight:700;">${fullStr}</span>`;
        }
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

        // 하단 영양성분 / 칼로리 및 알레르기 안내 영역 재구성 (통일된 골드 앰버 포인트 컬러 적용)
        if (nutrition) {
            const calText = meal.calories || '740 kcal';
            const nutText = meal.nutrition || '단백질 33.0g | 칼슘 215mg';
            nutrition.innerHTML = `
                <div style="margin-top:12px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.15);">
                    <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); padding:6px 10px; border-radius:8px; margin-bottom:8px;">
                        <span style="font-size:11.5px; color:#fde047; font-weight:700;"><i class="fa-solid fa-fire-flame-curved"></i> 칼로리 & 영양:</span>
                        <span style="font-size:11.5px; color:#f8fafc; font-weight:700;">${calText} (${nutText})</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); padding:8px 10px; border-radius:8px;">
                        <div style="font-size:10.5px; color:#fde047; font-weight:700; margin-bottom:3px;"><i class="fa-solid fa-circle-info"></i> 알레르기 유발 식품 번호 안내</div>
                        <p style="font-size:10px; line-height:1.45; color:#cbd5e1; margin:0;">
                            1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우 10.돼지고기 11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기 16.쇠고기 17.오징어 18.조개류(굴, 전복, 홍합 포함) 19.잣
                        </p>
                    </div>
                </div>
            `;
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
            mealPairMode = 0; // 모달을 닫고 다시 열면 항상 가장 최신(오늘 급식) 탭으로 자동 초기화
            renderMealModalData();
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                mealModal.classList.add('active');
                mealBackdrop.classList.add('active');
            });
        }
    }

    function closeMealModal() {
        if (mealModal && mealBackdrop) {
            mealModal.classList.remove('active');
            mealBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
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

    // 새로고침 버튼(#refresh-timetable-btn) 이벤트 바인딩
    const refreshTimetableBtn = document.getElementById('refresh-timetable-btn');
    if (refreshTimetableBtn) {
        refreshTimetableBtn.addEventListener('click', () => {
            loadYangYoungTimetable();
        });
    }

    // API에서 수신한 주간 시간표 데이터를 표(Table)에 동적 렌더링하는 함수
    function renderTimetableData(schedule) {
        if (!schedule) return;

        // schedule[dayIndex]: 요일 0(월)~4(금)
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
            const dayNum = dayIndex + 1; // 1(월)~5(금)
            const daySchedule = Array.isArray(schedule) ? schedule[dayIndex] : (schedule[dayNum] || schedule[String(dayNum)]);

            // 요일 전체 수업 유무 판별 (공휴일/국경일/재량휴업일 등 시간표가 없는 요일)
            let isDayOff = true;
            if (daySchedule) {
                for (let p = 1; p <= 7; p++) {
                    let info = null;
                    if (Array.isArray(daySchedule)) {
                        info = daySchedule.find(item => item && (item.classTime == p || item.period == p));
                        if (!info) {
                            info = daySchedule[p - 1] !== undefined ? daySchedule[p - 1] : daySchedule[p];
                        }
                    } else if (typeof daySchedule === 'object') {
                        info = daySchedule[p] || daySchedule[String(p)] || daySchedule[p - 1];
                    }

                    let subName = "";
                    if (info) {
                        if (typeof info === 'object') {
                            subName = info.subject || info.subjectName || info.name || "";
                        } else if (typeof info === 'string') {
                            subName = info.trim();
                        }
                    }
                    if (subName && subName !== '-') {
                        isDayOff = false;
                        break;
                    }
                }
            }



            for (let period = 1; period <= 7; period++) {
                // 1) data-day와 data-period 속성을 이용해 셀 탐색
                let cell = document.querySelector(`.comtime-table td[data-day="${dayNum}"][data-period="${period}"]`);

                // 2) 점심시간 행(.lunch-row)을 스킵하는 예비 DOM 탐색 로직 (1~4교시 -> 점심시간 행 -> 5~7교시)
                if (!cell) {
                    const periodRows = document.querySelectorAll('.comtime-table tbody tr:not(.lunch-row)');
                    if (periodRows[period - 1]) {
                        const cells = periodRows[period - 1].querySelectorAll('td');
                        cell = cells[dayNum]; // index 0은 교시 레이블 column
                    }
                }

                if (!cell) continue;

                // 요일 내부 0~7교시 (classTime 1~8) 데이터 파싱
                let classInfo = null;
                if (Array.isArray(daySchedule)) {
                    classInfo = daySchedule.find(item => item && (item.classTime == period || item.period == period));
                    if (!classInfo) {
                        if (daySchedule[period - 1] !== undefined && daySchedule[period - 1] !== null) {
                            classInfo = daySchedule[period - 1];
                        } else if (daySchedule[period] !== undefined && daySchedule[period] !== null) {
                            classInfo = daySchedule[period];
                        }
                    }
                } else if (daySchedule && typeof daySchedule === 'object') {
                    classInfo = daySchedule[period] || daySchedule[String(period)] || daySchedule[period - 1];
                }

                let subject = "";
                let teacher = "";

                if (classInfo) {
                    if (typeof classInfo === 'object') {
                        subject = classInfo.subject || classInfo.subjectName || classInfo.name || "";
                        teacher = classInfo.teacher || classInfo.teacherName || classInfo.teacher_name || "";
                    } else if (typeof classInfo === 'string') {
                        subject = classInfo.trim();
                    }
                }

                // 셀 스타일 및 내용 업데이트
                cell.className = '';

                if (isDayOff) {
                    // 시간표가 아예 없는 요일 (공휴일/국경일 등): 요일 헤더 배경(#1e293b)과 동일하게 설정
                    cell.classList.add('sub-bg-dayoff');
                    cell.textContent = '-';
                } else if (subject && subject !== '-') {
                    // 과목 색상 제거: 깔끔한 단일 텍스트 모던 레이아웃
                    cell.classList.add('sub-bg-normal');
                    if (teacher && teacher.trim() !== '') {
                        cell.innerHTML = `<b>${subject}</b><br><small style="font-size: 9px; opacity: 0.8; font-weight: 400;">${teacher}</small>`;
                    } else {
                        cell.innerHTML = `<b>${subject}</b>`;
                    }
                } else {
                    // 수업이 없는 일반 빈 셀
                    cell.classList.add('sub-bg-empty');
                    cell.textContent = '-';
                }
            }
        }
    }

    // Firebase Cloud Functions API에서 양영중학교 1학년 6반 주간 시간표 불러오기
    async function loadYangYoungTimetable() {
        const tableWrapper = document.querySelector('.timetable-table-wrapper');
        const refreshBtn = document.getElementById('refresh-timetable-btn');
        const weekRangeTextEl = document.getElementById('week-range-text');

        // 로딩 시각 효과 (표 opacity 감소 & 새로고침 아이콘 회전)
        if (tableWrapper) {
            tableWrapper.style.transition = 'opacity 0.2s ease';
            tableWrapper.style.opacity = '0.35';
        }
        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
        }

        const apiUrl = "https://us-central1-our-class-web.cloudfunctions.net/getTimetable";
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const resJson = await response.json();

            if (resJson && resJson.success && resJson.schedule) {
                if (resJson.currentWeekRange && weekRangeTextEl) {
                    weekRangeTextEl.textContent = `일자: ${resJson.currentWeekRange}`;
                }
                renderTimetableData(resJson.schedule);
                console.log("🔥 양영중 1학년 6반 주간 시간표 수신 및 렌더링 성공:", resJson);
            } else {
                console.warn("시간표 API 응답 실패 또는 형식 오류:", resJson);
                if (weekRangeTextEl) {
                    weekRangeTextEl.textContent = "일자: 수신 실패";
                }
                alert("시간표 데이터를 불러오는 데 실패했습니다.");
            }
        } catch (error) {
            console.error("시간표 데이터를 불러오는 중 오류 발생:", error);
            if (weekRangeTextEl) {
                weekRangeTextEl.textContent = "일자: 수신 실패";
            }
            alert("시간표 데이터를 불러오는 데 실패했습니다.");
        } finally {
            // 로딩 시각 효과 해제 (opacity 복원 & 회전 중지)
            if (tableWrapper) {
                tableWrapper.style.opacity = '1';
            }
            if (refreshBtn) {
                refreshBtn.classList.remove('spinning');
                const icon = refreshBtn.querySelector('i');
                if (icon) icon.classList.remove('fa-spin');
            }
        }
    }

    // 페이지 로드 시 initial timetable load 실행
    loadYangYoungTimetable();

    function openTimetableModal() {
        if (timetableModal && timetableBackdrop) {
            loadYangYoungTimetable();
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                timetableModal.classList.add('active');
                timetableBackdrop.classList.add('active');
            });
        }
    }
    function closeTimetableModal() {
        if (timetableModal && timetableBackdrop) {
            timetableModal.classList.remove('active');
            timetableBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
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

    function openNoticeModal(targetIdx = null) {
        const validIdx = (typeof targetIdx === 'number' && !isNaN(targetIdx)) ? targetIdx : null;
        if (noticeModal && noticeBackdrop) {
            if (typeof renderNoticesUI === 'function') {
                renderNoticesUI(validIdx);
            }
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                noticeModal.classList.add('active');
                noticeBackdrop.classList.add('active');
            });
        }
    }
    function closeNoticeModal() {
        if (noticeModal && noticeBackdrop) {
            noticeModal.classList.remove('active');
            noticeBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
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
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                supplyModal.classList.add('active');
                supplyBackdrop.classList.add('active');
            });
        }
    }
    function closeSupplyModal() {
        if (supplyModal && supplyBackdrop) {
            supplyModal.classList.remove('active');
            supplyBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
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

    function openExamModal(targetIdx = null) {
        const validIdx = (typeof targetIdx === 'number' && !isNaN(targetIdx)) ? targetIdx : null;
        if (examModal && examBackdrop) {
            if (typeof renderExamUI === 'function') {
                renderExamUI(validIdx);
            }
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                examModal.classList.add('active');
                examBackdrop.classList.add('active');
            });
        }
    }
    window.openExamModal = openExamModal;
    function closeExamModal() {
        if (examModal && examBackdrop) {
            examModal.classList.remove('active');
            examBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
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
            renderGalleryModalContent();
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                galleryModal.classList.add('active');
                galleryBackdrop.classList.add('active');
            });
        }
    }
    function renderGalleryModalContent() {
        const modalContent = document.querySelector('#galleryModal .gallery-modal-content');
        if (!modalContent) return;
        const currentItems = JSON.parse(localStorage.getItem('app_gallery_items') || '[]');
        if (currentItems.length === 0) {
            modalContent.innerHTML = `
                <div class="vacation-notice-box" style="margin-top: 10px;">
                    <i class="fa-solid fa-images" style="font-size: 32px; color: #38bdf8; margin-bottom: 10px;"></i>
                    <h4 style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 6px;">등록된 갤러리 사진이 없습니다 📸</h4>
                    <p style="font-size: 11.5px; color: #94a3b8; line-height: 1.5;">관리자 페이지에서 1학년 6반의 추억 사진을 등록해보세요!</p>
                </div>`;
        } else {
            modalContent.innerHTML = `
                <div class="gallery-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-top:10px;">
                    ${currentItems.map((item, i) => `
                        <div class="gallery-modal-card" style="border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); cursor:pointer;" onclick="if(window.openLightbox) window.openLightbox('${item.src}', '${item.caption}')">
                            <img src="${item.src}" alt="${item.caption}" style="width:100%; height:120px; object-fit:cover; display:block;">
                            <div style="padding:6px 8px; font-size:11px; color:#f8fafc; font-weight:700; background:rgba(15,23,42,0.8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                ${i + 1}. ${item.caption}
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }
    }
    function closeGalleryModal() {
        if (galleryModal && galleryBackdrop) {
            galleryModal.classList.remove('active');
            galleryBackdrop.classList.remove('active');
            resumeAllBackgroundTimers();
        }
    }
    if (drawerGalleryBtn) drawerGalleryBtn.addEventListener('click', () => { closeDrawer(); openGalleryModal(); });
    if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGalleryModal);
    if (galleryBackdrop) galleryBackdrop.addEventListener('click', closeGalleryModal);

    // 라이트박스 이미지 대형 확대 모달 제어
    const imageLightboxModal = document.getElementById('imageLightboxModal');
    const imageLightboxBackdrop = document.getElementById('imageLightboxBackdrop');
    const imageLightboxCloseBtn = document.getElementById('imageLightboxCloseBtn');
    const lightboxTargetImg = document.getElementById('lightboxTargetImg');
    const lightboxCaptionText = document.getElementById('lightboxCaptionText');

    function openImageLightbox(imgSrc, caption = '') {
        if (imageLightboxModal && lightboxTargetImg) {
            lightboxTargetImg.src = imgSrc;
            if (lightboxCaptionText) lightboxCaptionText.textContent = caption || '1학년 6반 추억 사진';
            pauseAllBackgroundTimers();
            requestAnimationFrame(() => {
                imageLightboxModal.classList.add('active');
                if (imageLightboxBackdrop) imageLightboxBackdrop.classList.add('active');
            });
        }
    }
    window.openLightbox = openImageLightbox;

    function closeImageLightbox() {
        if (imageLightboxModal) imageLightboxModal.classList.remove('active');
        if (imageLightboxBackdrop) imageLightboxBackdrop.classList.remove('active');
        resumeAllBackgroundTimers();
    }

    if (imageLightboxCloseBtn) imageLightboxCloseBtn.addEventListener('click', closeImageLightbox);
    if (imageLightboxBackdrop) imageLightboxBackdrop.addEventListener('click', closeImageLightbox);
    if (lightboxTargetImg) lightboxTargetImg.addEventListener('click', closeImageLightbox);

    // 포토갤러리 및 시험일정, 모달 내 모든 이미지 터치/클릭 시 라이트박스 확대 팝업 오픈
    document.addEventListener('click', (e) => {
        const targetImg = e.target.closest('.gallery-preview-card img, .gallery-card img, .gallery-modal-card img, .exam-image-upload-slot img, .sec-gallery img, #galleryModal img');
        if (targetImg) {
            const caption = targetImg.alt || targetImg.nextElementSibling?.textContent || '1학년 6반 추억 사진';
            openImageLightbox(targetImg.src, caption);
        }
    });

    if (drawerWeatherBtn) drawerWeatherBtn.addEventListener('click', () => { closeDrawer(); openWeatherModal(); });
    if (drawerMealBtn) drawerMealBtn.addEventListener('click', () => { closeDrawer(); openMealModal(); });

    // 푸터 하단 인라인 펼침 박스 제어 (위치 정보 반영 방식 & 1학년 6반 학급 명단)
    const btnOpenLocationInfo = document.getElementById('btnOpenLocationInfo');
    const btnOpenUserInfo = document.getElementById('btnOpenUserInfo');
    const footerLocationExpandBox = document.getElementById('footerLocationExpandBox');
    const footerUserExpandBox = document.getElementById('footerUserExpandBox');
    const btnCloseLocationInline = document.getElementById('btnCloseLocationInline');
    const btnCloseUserInline = document.getElementById('btnCloseUserInline');

    if (btnOpenLocationInfo) {
        btnOpenLocationInfo.addEventListener('click', () => {
            if (footerUserExpandBox) footerUserExpandBox.classList.remove('active');
            if (footerLocationExpandBox) footerLocationExpandBox.classList.toggle('active');
        });
    }

    if (btnOpenUserInfo) {
        btnOpenUserInfo.addEventListener('click', () => {
            if (footerLocationExpandBox) footerLocationExpandBox.classList.remove('active');
            if (footerUserExpandBox) footerUserExpandBox.classList.toggle('active');
        });
    }

    if (btnCloseLocationInline) {
        btnCloseLocationInline.addEventListener('click', () => {
            if (footerLocationExpandBox) footerLocationExpandBox.classList.remove('active');
        });
    }

    if (btnCloseUserInline) {
        btnCloseUserInline.addEventListener('click', () => {
            if (footerUserExpandBox) footerUserExpandBox.classList.remove('active');
        });
    }

    // 15. 통합 관리자 전용 센터 모달 제어
    const adminModal = document.getElementById('adminModal');
    const adminBackdrop = document.getElementById('adminBackdrop');
    const adminCloseBtn = document.getElementById('adminCloseBtn');
    const drawerAdminBtn = document.getElementById('drawerAdminBtn');
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminTabPanels = document.querySelectorAll('.admin-tab-panel');

    function openAdminModal() {
        window.open('admin.html', '_blank');
    }

    if (drawerAdminBtn) drawerAdminBtn.addEventListener('click', (e) => {
        closeDrawer();
        openAdminModal();
    });
    if (adminCloseBtn) adminCloseBtn.addEventListener('click', closeAdminModal);
    if (adminBackdrop) adminBackdrop.addEventListener('click', closeAdminModal);

    // 새창 관리자 페이지(admin.html) 저장 시 실시간 멀티탭/새창 동기화 리스너
    window.addEventListener('storage', (e) => {
        if (e.key === 'app_notices_list' && typeof renderNoticesUI === 'function') {
            renderNoticesUI();
        } else if (e.key === 'app_exam_data' && typeof renderExamUI === 'function') {
            renderExamUI();
        } else if (e.key === 'app_gallery_items' && typeof renderGallerySlider === 'function') {
            renderGallerySlider();
        } else if (e.key === 'app_supply_text' && typeof renderSupplyUI === 'function') {
            renderSupplyUI();
        } else if (e.key === 'app_school_name') {
            const name = localStorage.getItem('app_school_name');
            if (name) {
                const titleEl = document.getElementById('displaySchoolName');
                if (titleEl) titleEl.textContent = name;
            }
        }
    });

    // 통합 관리자 센터 탭 전환 (공지, 시간표, 시험, 준비물, 갤러리 5종)
    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            adminTabBtns.forEach(b => b.classList.remove('active'));
            adminTabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // Firebase Auth 인증 및 대시보드 상태 제어
    const adminLoginBox = document.getElementById('adminLoginBox');
    const adminDashboardBox = document.getElementById('adminDashboardBox');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminEmailInput = document.getElementById('adminEmailInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const btnFirebaseLogin = document.getElementById('btnFirebaseLogin');
    const btnAdminLogout = document.getElementById('btnAdminLogout');
    const adminUserEmailTag = document.getElementById('adminUserEmailTag');
    const adminAuthMsg = document.getElementById('adminAuthMsg');

    function showAuthMsg(msg, isError = true) {
        if (!adminAuthMsg) return;
        adminAuthMsg.textContent = msg;
        adminAuthMsg.className = `admin-auth-msg ${isError ? 'error' : 'success'}`;
    }
    function hideAuthMsg() {
        if (adminAuthMsg) adminAuthMsg.className = 'admin-auth-msg';
    }

    // Firebase Auth 및 세션 전용 로그인 상태 체크 (브라우저 종료 시 자동 로그아웃)
    function checkAdminLoginSession() {
        const savedUser = sessionStorage.getItem('app_admin_logged_in');
        if (savedUser) {
            if (adminLoginBox) adminLoginBox.style.display = 'none';
            if (adminDashboardBox) adminDashboardBox.style.display = 'block';
            if (adminUserEmailTag) adminUserEmailTag.textContent = `${savedUser} (관리자)`;
            return true;
        }
        return false;
    }

    function initFirebaseAuthListener() {
        const loggedInUser = sessionStorage.getItem('app_admin_logged_in');

        // 보안 강화: 브라우저 종료 후 새 창으로 재접속 시 자동 로그아웃 수행
        if (!loggedInUser) {
            if (window.signOut && window.auth) {
                window.signOut(window.auth).catch(() => {});
            }
            if (adminLoginBox) adminLoginBox.style.display = 'block';
            if (adminDashboardBox) adminDashboardBox.style.display = 'none';
            return;
        }

        if (window.onAuthStateChanged && window.auth) {
            window.onAuthStateChanged(window.auth, (user) => {
                if (user && sessionStorage.getItem('app_admin_logged_in')) {
                    if (adminLoginBox) adminLoginBox.style.display = 'none';
                    if (adminDashboardBox) adminDashboardBox.style.display = 'block';
                    if (adminUserEmailTag) adminUserEmailTag.textContent = user.email || loggedInUser;
                } else {
                    sessionStorage.removeItem('app_admin_logged_in');
                    if (adminLoginBox) adminLoginBox.style.display = 'block';
                    if (adminDashboardBox) adminDashboardBox.style.display = 'none';
                }
            });
        } else {
            checkAdminLoginSession();
        }
    }
    setTimeout(initFirebaseAuthListener, 300);

    // Firebase Authentication 세션 전용 로그인 처리
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthMsg();

            const email = adminEmailInput.value.trim();
            const password = adminPasswordInput.value.trim();

            if (!email || !password) {
                showAuthMsg('이메일과 비밀번호를 모두 입력해주세요.');
                return;
            }

            btnFirebaseLogin.disabled = true;
            btnFirebaseLogin.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 인증 확인 중...`;

            try {
                if (window.signInWithEmailAndPassword && window.auth) {
                    // 세션 지속성 설정 (브라우저 종료 시 토큰 자동 만료)
                    if (window.setPersistence && window.browserSessionPersistence) {
                        try {
                            await window.setPersistence(window.auth, window.browserSessionPersistence);
                        } catch (pe) { }
                    }

                    const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
                    const user = userCredential.user;

                    showAuthMsg('✅ 관리자 로그인 성공!', false);
                    sessionStorage.setItem('app_admin_logged_in', user.email || email);

                    setTimeout(() => {
                        if (adminLoginBox) adminLoginBox.style.display = 'none';
                        if (adminDashboardBox) adminDashboardBox.style.display = 'block';
                        if (adminUserEmailTag) adminUserEmailTag.textContent = user.email || email;
                    }, 400);
                } else {
                    showAuthMsg('❌ 로그인 오류: 인증 서비스 연결 준비 중입니다.');
                }
            } catch (error) {
                console.error('Auth Login Error:', error);

                let errStr = '❌ 로그인 실패: 등록된 관리자 이메일 또는 비밀번호가 올바르지 않습니다.';
                if (error.code === 'auth/invalid-email') {
                    errStr = '❌ 로그인 실패: 올바른 이메일 형식이 아닙니다.';
                } else if (error.code === 'auth/user-disabled') {
                    errStr = '❌ 로그인 실패: 비활성화된 계정입니다.';
                } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errStr = '❌ 로그인 실패: 등록된 관리자 계정 이메일 또는 비밀번호가 일치하지 않습니다.';
                }
                showAuthMsg(errStr);
            } finally {
                btnFirebaseLogin.disabled = false;
                btnFirebaseLogin.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> 관리자 인증 로그인`;
            }
        });
    }

    // 관리자 로그아웃 처리
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', async () => {
            try {
                if (window.signOut && window.auth) {
                    await window.signOut(window.auth);
                }
            } catch (e) { }

            sessionStorage.removeItem('app_admin_logged_in');

            if (adminLoginBox) adminLoginBox.style.display = 'block';
            if (adminDashboardBox) adminDashboardBox.style.display = 'none';
            if (adminEmailInput) adminEmailInput.value = '';
            if (adminPasswordInput) adminPasswordInput.value = '';

            hideAuthMsg();
            showAuthMsg('🔒 성공적으로 로그아웃되었습니다.', false);
        });
    }

    // 16. 관리자 대시보드 6종 실시간 데이터 업데이트 및 통계 트래커
    const adminNoticeForm = document.getElementById('adminNoticeForm');
    const adminExamForm = document.getElementById('adminExamForm');
    const adminExamDate = document.getElementById('adminExamDate');
    const adminExamDdayDisplay = document.getElementById('adminExamDdayDisplay');
    const adminSupplyForm = document.getElementById('adminSupplyForm');
    const adminGalleryForm = document.getElementById('adminGalleryForm');
    const btnSyncComtime = document.getElementById('btnSyncComtime');

    // --- 이미지 파일 경량화 압축 헬퍼 (LocalStorage 및 Firestore 5MB/1MB 제한 방지) ---
    function compressImageFile(file, maxWidth = 1000, maxHeight = 1000, quality = 0.75) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('올바른 이미지 파일이 아닙니다.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        if (width / height > maxWidth / maxHeight) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    // --- Firebase Firestore & LocalStorage 이중 통합 저장 헬퍼 ---
    async function saveToRemoteAndLocal(key, data) {
        try {
            const valToStore = typeof data === 'string' ? data : JSON.stringify(data);
            localStorage.setItem(key, valToStore);
        } catch (e) {
            console.warn(`LocalStorage save warning for ${key}:`, e);
        }

        try {
            if (window.db && window.setDoc && window.doc) {
                const docRef = window.doc(window.db, "class_portal", key);
                await window.setDoc(docRef, { data: data, updatedAt: new Date().toISOString() });
                console.log(`🔥 Firestore synced successfully for ${key}`);
            }
        } catch (e) {
            console.warn(`Firestore sync error for ${key}:`, e);
        }
    }

    // --- Firestore 실시간 클라우드 동기화 구독 헬퍼 ---
    function setupRemoteSync(key, onDataReceived) {
        function trySubscribe() {
            if (window.db && window.doc && window.onSnapshot) {
                try {
                    const docRef = window.doc(window.db, "class_portal", key);
                    window.onSnapshot(docRef, (snapshot) => {
                        if (snapshot.exists()) {
                            const remoteData = snapshot.data()?.data;
                            if (remoteData !== undefined && remoteData !== null) {
                                try {
                                    const valToStore = typeof remoteData === 'string' ? remoteData : JSON.stringify(remoteData);
                                    localStorage.setItem(key, valToStore);
                                } catch (e) {}
                                onDataReceived(remoteData);
                            }
                        }
                    }, (err) => {
                        console.warn(`Firestore snapshot listener error for ${key}:`, err);
                    });
                } catch (e) {
                    console.warn(`Firestore subscribe error for ${key}:`, e);
                }
            }
        }

        if (window.db && window.onSnapshot) {
            trySubscribe();
        } else {
            setTimeout(trySubscribe, 600);
            setTimeout(trySubscribe, 1800);
        }
    }

    // --- 1. 공지사항 최대 3개 등록 및 메인/모달 UI 관리 ---
    const defaultNotices = [
        { active: true, tag: 'red', tagText: '[중요 공지]', date: '2026. 08. 05', title: '안전하게 여름방학 즐기기! 🍉🏖️', body: '1학년 6반 학생 여러분, 즐겁고 보람찬 여름방학 기간 동안 건강과 안전을 최우선으로 지켜주시기 바랍니다!' },
        { active: true, tag: 'blue', tagText: '[학급 안내]', date: '2026. 08. 01', title: '2학기 희망 도서 신청 안내 📚', body: '읽고 싶은 추천 도서 목록을 담임선생님께 제출해주세요.' },
        { active: true, tag: 'green', tagText: '[방학 안내]', date: '2026. 07. 28', title: '여름방학 방과후 수강 안내 🎨', body: '방과후 강좌 수강생들은 시간표 및 교재를 미리 확인하시기 바랍니다.' }
    ];

    let noticesList = JSON.parse(localStorage.getItem('app_notices_list') || 'null');
    if (!noticesList) {
        noticesList = defaultNotices;
        localStorage.setItem('app_notices_list', JSON.stringify(noticesList));
    }

    let currentAdminNoticeIdx = 0;

    function loadAdminNoticeFields(idx) {
        currentAdminNoticeIdx = idx;
        const notice = noticesList[idx] || defaultNotices[0];
        const activeCheck = document.getElementById('adminNoticeActive');
        const tagSelect = document.getElementById('adminNoticeTag');
        const dateInput = document.getElementById('adminNoticeDate');
        const titleInput = document.getElementById('adminNoticeTitle');
        const bodyInput = document.getElementById('adminNoticeBody');

        if (activeCheck) activeCheck.checked = notice.active !== false;
        if (tagSelect) tagSelect.value = notice.tag || 'red';
        if (dateInput) dateInput.value = notice.date || '';
        if (titleInput) titleInput.value = notice.title || '';
        if (bodyInput) bodyInput.value = notice.body || '';

        document.querySelectorAll('.notice-num-btn').forEach((btn, i) => {
            if (i === idx) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function renderNoticesUI(selectedIdx = null) {
        const activeNotices = noticesList.filter(n => n.active !== false);
        const countBadge = document.getElementById('modalNoticeCountBadge');
        if (countBadge) countBadge.textContent = `등록 ${activeNotices.length}개`;

        // 첫 번째 활성화된 공지사항 인덱스 찾기
        const firstActiveIdx = noticesList.findIndex(n => n.active !== false);
        const defaultIdx = (firstActiveIdx !== -1) ? firstActiveIdx : 0;

        const validIdx = (typeof selectedIdx === 'number' && !isNaN(selectedIdx)) ? selectedIdx : null;
        const initialIdx = (validIdx !== null && noticesList[validIdx] && noticesList[validIdx].active !== false)
            ? validIdx
            : defaultIdx;

        const modalTabBar = document.getElementById('noticeModalTabBar');
        if (modalTabBar) {
            modalTabBar.innerHTML = noticesList.map((n, i) => `
                <button type="button" class="notice-tab-btn ${i === initialIdx ? 'active' : ''}" data-notice-tab="${i}" ${!n.active ? 'disabled' : ''}>
                    📌 공지 ${i + 1}
                </button>
            `).join('');

            modalTabBar.querySelectorAll('.notice-tab-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const tabIdx = parseInt(btn.getAttribute('data-notice-tab'), 10);
                    modalTabBar.querySelectorAll('.notice-tab-btn').forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-selected', 'false');
                    });
                    btn.classList.add('active');
                    btn.setAttribute('aria-selected', 'true');
                    showNoticeDetailInModal(tabIdx);
                });
            });
        }
        showNoticeDetailInModal(initialIdx);
    }

    function showNoticeDetailInModal(idx) {
        const notice = noticesList[idx];
        if (!notice) return;
        const metaBar = document.getElementById('noticeModalMetaBar');
        const heading = document.getElementById('noticeModalHeading');
        const bodyText = document.getElementById('noticeModalBodyText');

        let badgeClass = 'red';
        let badgeText = '[중요 공지]';
        if (notice.tag === 'blue') { badgeClass = 'blue'; badgeText = '[학급 안내]'; }
        else if (notice.tag === 'green') { badgeClass = 'green'; badgeText = '[방학 안내]'; }

        if (metaBar) {
            metaBar.innerHTML = `<span class="notice-badge ${badgeClass}"><i class="fa-solid fa-bell"></i> ${badgeText}</span><span class="notice-date">${notice.date}</span>`;
        }
        if (heading) heading.textContent = notice.title;
        if (bodyText) {
            bodyText.innerHTML = `
                <p style="margin-bottom: 12px; line-height: 1.5; color: #cbd5e1; font-size: 12.5px;">${notice.body}</p>
                <div class="notice-rule-box" style="margin-top: 12px; padding: 10px 12px;">
                    <div class="rule-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-circle-exclamation" style="color: #38bdf8; font-size: 16px; flex-shrink: 0;"></i>
                        <span style="color: #f8fafc; font-size: 12px; font-weight: 600;">1학년 6반 공지사항을 꼭 확인하세요.</span>
                    </div>
                </div>
            `;
        }
    }

    document.querySelectorAll('.notice-num-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            loadAdminNoticeFields(i);
        });
    });

    if (adminNoticeForm) {
        adminNoticeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const isActive = document.getElementById('adminNoticeActive')?.checked;
                const tagVal = document.getElementById('adminNoticeTag')?.value || 'red';
                const dateVal = document.getElementById('adminNoticeDate')?.value || '';
                const titleVal = document.getElementById('adminNoticeTitle')?.value || '';
                const bodyVal = document.getElementById('adminNoticeBody')?.value || '';

                let tagText = '[중요 공지]';
                if (tagVal === 'blue') tagText = '[학급 안내]';
                else if (tagVal === 'green') tagText = '[방학 안내]';

                noticesList[currentAdminNoticeIdx] = {
                    active: isActive,
                    tag: tagVal,
                    tagText: tagText,
                    date: dateVal,
                    title: titleVal,
                    body: bodyVal
                };

                await saveToRemoteAndLocal('app_notices_list', noticesList);
                renderNoticesUI();
                alert(`✅ 공지사항 ${currentAdminNoticeIdx + 1}번 항목이 저장되었습니다!`);
            } catch (err) {
                console.error('Notice Form Error:', err);
                alert(`⚠️ 공지사항 저장 중 오류가 발생했습니다: ${err.message}`);
            }
        });
    }
    renderNoticesUI();
    setupRemoteSync('app_notices_list', (remoteData) => {
        if (Array.isArray(remoteData)) {
            noticesList = remoteData;
            renderNoticesUI();
        }
    });

    // --- 2. 다중 시험일정 (최대 10개) 텍스트 & 시간표 이미지 파일 첨부 및 실시간 동기화 ---
    const adminExamImgFile = document.getElementById('adminExamImgFile');
    const adminExamImgUrl = document.getElementById('adminExamImgUrl');
    const adminExamImgPreview = document.getElementById('adminExamImgPreview');
    const examPreviewImgTag = document.getElementById('examPreviewImgTag');
    const adminExamDateInput = document.getElementById('adminExamDate');
    let uploadedExamImgSrc = '';

    const defaultExamList = [
        { active: true, title: '2026학년도 1차 지필고사', targetDate: '2026-11-10', period: '11월 10일(화) ~ 11월 12일(목)', imgSrc: '' },
        { active: true, title: '2026학년도 영어듣기평가', targetDate: '2026-09-20', period: '9월 20일(목)', imgSrc: '' },
        { active: true, title: '2학기 수행평가 안내', targetDate: '2026-10-15', period: '10월 15일(목) ~ 10월 18일(일)', imgSrc: '' },
        { active: false, title: '2차 지필고사 (예정)', targetDate: '2026-12-15', period: '12월 15일(화) ~ 12월 18일(금)', imgSrc: '' },
        { active: false, title: '시험 5', targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' },
        { active: false, title: '시험 6', targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' },
        { active: false, title: '시험 7', targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' },
        { active: false, title: '시험 8', targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' },
        { active: false, title: '시험 9', targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' },
        { active: false, title: '시험 10', targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' }
    ];

    function getExamListFromStorage() {
        const savedList = JSON.parse(localStorage.getItem('app_exam_list') || 'null');
        if (Array.isArray(savedList) && savedList.length > 0) {
            while (savedList.length < 10) {
                savedList.push({ active: false, title: `시험 ${savedList.length + 1}`, targetDate: '2026-12-20', period: '기간 미정', imgSrc: '' });
            }
            return savedList;
        }

        // 하위 호환성 마이그레이션
        const oldData = JSON.parse(localStorage.getItem('app_exam_data') || 'null');
        if (oldData && oldData.title) {
            const newList = [...defaultExamList];
            newList[0] = { active: true, title: oldData.title, targetDate: oldData.targetDate, period: oldData.period, imgSrc: oldData.imgSrc || '' };
            localStorage.setItem('app_exam_list', JSON.stringify(newList));
            return newList;
        }

        localStorage.setItem('app_exam_list', JSON.stringify(defaultExamList));
        return defaultExamList;
    }

    function calculateDdayStr(targetDateStr) {
        if (!targetDateStr) return 'D-Day';
        const parts = targetDateStr.split('-');
        if (parts.length !== 3) return 'D-Day';
        const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const today = new Date();
        const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.ceil((target - todayZero) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `D-${diffDays}` : (diffDays === 0 ? 'D-Day' : `D+${Math.abs(diffDays)}`);
    }

    function calculateDdayNumber(targetDateStr) {
        if (!targetDateStr) return 99999;
        const parts = targetDateStr.split('-');
        if (parts.length !== 3) return 99999;
        const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const today = new Date();
        const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return Math.ceil((target - todayZero) / (1000 * 60 * 60 * 24));
    }

    if (adminExamDateInput) {
        adminExamDateInput.addEventListener('change', (e) => {
            const ddayDisplay = document.getElementById('adminExamDdayDisplay');
            if (ddayDisplay) {
                ddayDisplay.value = calculateDdayStr(e.target.value);
            }
        });
    }

    function showExamDetailInModal(examIdx, examList) {
        const exam = examList[examIdx];
        if (!exam) return;

        const ddayBadge = document.getElementById('examModalDdayBadge');
        const titleText = document.getElementById('examModalTitleText');
        const periodText = document.getElementById('examModalPeriodText');
        const examSlot = document.getElementById('examImageSlot');

        const ddayStr = calculateDdayStr(exam.targetDate);

        if (ddayBadge) ddayBadge.textContent = ddayStr;
        if (titleText) titleText.textContent = exam.title;
        if (periodText) periodText.textContent = exam.period;

        if (examSlot) {
            if (exam.imgSrc) {
                examSlot.innerHTML = `<img src="${exam.imgSrc}" alt="${exam.title}" style="width:100%; height:140px; border-radius:10px; display:block; object-fit: cover; object-position: top; cursor:pointer;" onclick="if(window.openLightbox) window.openLightbox('${exam.imgSrc}', '${exam.title}')">`;
            } else {
                examSlot.innerHTML = `
                    <div class="slot-placeholder" style="height:140px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-image"></i>
                        <span>시험일정 표 / 시간표 이미지 등록 칸</span>
                        <small>(나중에 올라오는 시험일정 이미지 표가 여기에 표시됩니다)</small>
                    </div>`;
            }
        }
    }

    function populateAdminExamForm(idx, examList) {
        const currentIdxInput = document.getElementById('currentAdminExamIdx');
        if (currentIdxInput) currentIdxInput.value = idx;

        const exam = examList[idx] || { active: false, title: `시험 ${idx + 1}`, targetDate: '2026-11-10', period: '기간 미정', imgSrc: '' };

        const activeCheckbox = document.getElementById('adminExamActive');
        const titleInput = document.getElementById('adminExamTitle');
        const dateInput = document.getElementById('adminExamDate');
        const ddayDisplay = document.getElementById('adminExamDdayDisplay');
        const periodInput = document.getElementById('adminExamPeriod');
        const imgUrlInput = document.getElementById('adminExamImgUrl');
        const imgPreviewDiv = document.getElementById('adminExamImgPreview');
        const previewTag = document.getElementById('examPreviewImgTag');

        if (activeCheckbox) activeCheckbox.checked = (exam.active !== false);
        if (titleInput) titleInput.value = exam.title || '';
        if (dateInput) dateInput.value = exam.targetDate || '2026-11-10';
        if (ddayDisplay) ddayDisplay.value = calculateDdayStr(exam.targetDate);
        if (periodInput) periodInput.value = exam.period || '';
        if (imgUrlInput) imgUrlInput.value = (!uploadedExamImgSrc && exam.imgSrc && !exam.imgSrc.startsWith('data:')) ? exam.imgSrc : '';

        if (uploadedExamImgSrc || exam.imgSrc) {
            if (previewTag) previewTag.src = uploadedExamImgSrc || exam.imgSrc;
            if (imgPreviewDiv) imgPreviewDiv.style.display = 'block';
        } else {
            if (previewTag) previewTag.src = '';
            if (imgPreviewDiv) imgPreviewDiv.style.display = 'none';
        }
    }

    function renderExamUI(selectedIdx = null) {
        const examList = getExamListFromStorage();
        const activeExams = examList.filter(e => e.active !== false);

        // 1. 모달 헤더 [등록 N개] 배지 업데이트
        const countBadge = document.getElementById('modalExamCountBadge');
        if (countBadge) countBadge.textContent = `등록 ${activeExams.length}개`;

        // D-Day가 가장 임박한 활성 시험 인덱스 찾기
        let closestActiveIdx = -1;
        let minDiff = 99999;

        examList.forEach((e, i) => {
            if (e.active !== false) {
                const diff = calculateDdayNumber(e.targetDate);
                const score = (diff >= 0) ? diff : 50000 + Math.abs(diff);
                if (score < minDiff) {
                    minDiff = score;
                    closestActiveIdx = i;
                }
            }
        });

        const defaultIdx = (closestActiveIdx !== -1) ? closestActiveIdx : 0;
        const validIdx = (typeof selectedIdx === 'number' && !isNaN(selectedIdx)) ? selectedIdx : null;
        const initialIdx = (validIdx !== null && examList[validIdx] && examList[validIdx].active !== false)
            ? validIdx
            : defaultIdx;

        // 2. index.html 모달 탭 바 (#examModalTabBar) 렌더링
        const modalTabBar = document.getElementById('examModalTabBar');
        if (modalTabBar) {
            if (activeExams.length === 0) {
                modalTabBar.innerHTML = `<span style="font-size:12px; color:#94a3b8;">등록된 시험일정이 없습니다.</span>`;
            } else {
                modalTabBar.innerHTML = examList.map((e, i) => {
                    if (e.active === false) return '';
                    return `
                        <button type="button" class="exam-tab-btn ${i === initialIdx ? 'active' : ''}" data-exam-tab="${i}">
                            시험 ${i + 1} (${calculateDdayStr(e.targetDate)})
                        </button>
                    `;
                }).join('');

                modalTabBar.querySelectorAll('.exam-tab-btn').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const tabIdx = parseInt(btn.getAttribute('data-exam-tab'), 10);
                        modalTabBar.querySelectorAll('.exam-tab-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        showExamDetailInModal(tabIdx, examList);
                    });
                });
            }
        }
        showExamDetailInModal(initialIdx, examList);

        // 3. 메인 배너 슬라이드 2 (D-Day 배너) - 가장 임박한 활성 시험 표출 (내용이 변경되었을 때만 DOM 업데이트)
        const mainBannerExam = examList[defaultIdx] || defaultExamList[0];
        const mainDdayStr = calculateDdayStr(mainBannerExam.targetDate);

        const slide2H2 = document.querySelector('.carousel-slide:nth-child(2) h2');
        const newH2Html = `${mainBannerExam.title} <span class="dday-large-tag" id="slide2DdayTag">${mainDdayStr}</span>`;
        if (slide2H2 && slide2H2.innerHTML !== newH2Html) slide2H2.innerHTML = newH2Html;

        const slide2P = document.querySelector('.carousel-slide:nth-child(2) p');
        const newPHtml = `<i class="fa-solid fa-pen-to-square"></i> 평가기간: ${mainBannerExam.period}`;
        if (slide2P && slide2P.innerHTML !== newPHtml) slide2P.innerHTML = newPHtml;

        // 4. 관리자 페이지(admin.html) 셀렉터 바 (#adminExamSelectorBar) 렌더링
        const adminSelectorBar = document.getElementById('adminExamSelectorBar');
        if (adminSelectorBar) {
            const currentAdminIdxInput = document.getElementById('currentAdminExamIdx');
            const currentAdminIdx = parseInt(currentAdminIdxInput?.value || '0', 10);

            adminSelectorBar.innerHTML = examList.map((e, i) => `
                <button type="button" class="admin-exam-btn ${i === currentAdminIdx ? 'active' : ''}" data-admin-exam="${i}">
                    ${i + 1}. ${e.title ? (e.title.length > 7 ? e.title.substring(0, 7) + '..' : e.title) : '시험 ' + (i + 1)} ${e.active !== false ? '✅' : '⚪'}
                </button>
            `).join('');

            adminSelectorBar.querySelectorAll('.admin-exam-btn').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    const idx = parseInt(btn.getAttribute('data-admin-exam'), 10);
                    uploadedExamImgSrc = ''; // 리셋
                    adminSelectorBar.querySelectorAll('.admin-exam-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    populateAdminExamForm(idx, examList);
                });
            });

            populateAdminExamForm(currentAdminIdx, examList);
        }

        // 5. 메인 화면 3번 배너 (히어로 달력) 연동 자동 업데이트
        if (typeof renderHeroMiniCalendar === 'function') {
            renderHeroMiniCalendar();
        }
    }

    if (adminExamImgFile) {
        adminExamImgFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('⚠️ 시험일정 이미지 용량이 10MB를 초과합니다! 10MB 이하의 파일을 선택해주세요.');
                    adminExamImgFile.value = '';
                    return;
                }
                try {
                    uploadedExamImgSrc = await compressImageFile(file, 1000, 1000, 0.75);
                    if (examPreviewImgTag) examPreviewImgTag.src = uploadedExamImgSrc;
                    if (adminExamImgPreview) adminExamImgPreview.style.display = 'block';
                } catch (err) {
                    console.error('Exam Image Compression Error:', err);
                    alert('⚠️ 이미지 파일 처리 중 오류가 발생했습니다.');
                }
            }
        });
    }

    const btnDeleteExamImg = document.getElementById('btnDeleteExamImg');
    if (btnDeleteExamImg) {
        btnDeleteExamImg.addEventListener('click', async () => {
            if (!confirm('🗑️ 선택한 시험일정의 첨부 이미지를 삭제하시겠습니까?')) return;
            const currentIdx = parseInt(document.getElementById('currentAdminExamIdx')?.value || '0', 10);
            uploadedExamImgSrc = '';
            const adminExamImgFile = document.getElementById('adminExamImgFile');
            const adminExamImgUrl = document.getElementById('adminExamImgUrl');
            const examPreviewImgTag = document.getElementById('examPreviewImgTag');
            const adminExamImgPreview = document.getElementById('adminExamImgPreview');

            if (adminExamImgFile) adminExamImgFile.value = '';
            if (adminExamImgUrl) adminExamImgUrl.value = '';
            if (examPreviewImgTag) examPreviewImgTag.src = '';
            if (adminExamImgPreview) adminExamImgPreview.style.display = 'none';

            const examList = getExamListFromStorage();
            if (examList[currentIdx]) {
                examList[currentIdx].imgSrc = '';
                await saveToRemoteAndLocal('app_exam_list', examList);
                renderExamUI(currentIdx);
                alert(`✅ [시험 ${currentIdx + 1}] 첨부 이미지가 성공적으로 삭제되었습니다!`);
            }
        });
    }

    if (adminExamForm) {
        adminExamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const currentIdx = parseInt(document.getElementById('currentAdminExamIdx')?.value || '0', 10);
                const isActive = document.getElementById('adminExamActive')?.checked !== false;
                const examTitle = document.getElementById('adminExamTitle')?.value || '';
                const targetDate = document.getElementById('adminExamDate')?.value || '2026-11-10';
                const periodVal = document.getElementById('adminExamPeriod')?.value || '';
                const customUrl = document.getElementById('adminExamImgUrl')?.value.trim() || '';

                const examList = getExamListFromStorage();
                const prevExam = examList[currentIdx] || {};

                let finalImgSrc = prevExam.imgSrc || '';
                if (uploadedExamImgSrc) {
                    finalImgSrc = uploadedExamImgSrc;
                } else if (customUrl) {
                    finalImgSrc = customUrl;
                }

                examList[currentIdx] = {
                    active: isActive,
                    title: examTitle,
                    targetDate: targetDate,
                    period: periodVal,
                    imgSrc: finalImgSrc
                };

                await saveToRemoteAndLocal('app_exam_list', examList);
                uploadedExamImgSrc = ''; // 저장 완료 후 리셋
                renderExamUI();

                alert(`✅ [시험 ${currentIdx + 1}] 시험일정 텍스트 및 시간표 이미지가 성공적으로 저장되어 모달, 배너, 달력에 완벽하게 반영되었습니다!`);
            } catch (err) {
                console.error('Exam Submit Error:', err);
                alert(`⚠️ 시험일정 저장 중 오류가 발생했습니다: ${err.message}`);
            }
        });
    }
    renderExamUI();
    setupRemoteSync('app_exam_list', (remoteData) => {
        if (Array.isArray(remoteData)) {
            renderExamUI();
        }
    });

    // --- 3. 시간표 수동 동기화 ---
    if (btnSyncComtime) {
        btnSyncComtime.addEventListener('click', async () => {
            btnSyncComtime.disabled = true;
            btnSyncComtime.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 최신 데이터 동기화 중...`;
            try {
                await loadYangYoungTimetable();
                alert('✅ 양영중학교 1학년 6반 시간표 최신 데이터가 성공적으로 동기화되었습니다!');
            } catch (err) {
                console.error("시간표 동기화 오류:", err);
                alert('⚠️ 시간표 데이터를 동기화하는 중 오류가 발생했습니다.');
            } finally {
                btnSyncComtime.disabled = false;
                btnSyncComtime.innerHTML = `<i class="fa-solid fa-rotate-right"></i> 시간표 최신 데이터 즉시 동기화`;
            }
        });
    }

    // --- 4. 준비물 저장 및 실시간 동기화 렌더링 ---
    function renderSupplyUI() {
        const supplyContent = document.querySelector('.supply-card-content');
        const adminSupplyText = document.getElementById('adminSupplyText');
        let savedSupplyText = localStorage.getItem('app_supply_text');

        // 기존에 JSON.stringify로 인해 이스케이프 쌍따옴표/슬래시가 들어간 데이터 자동 정화 및 복원
        if (typeof savedSupplyText === 'string') {
            try {
                if (savedSupplyText.startsWith('"') && savedSupplyText.endsWith('"')) {
                    savedSupplyText = JSON.parse(savedSupplyText);
                }
            } catch (e) {}
            if (typeof savedSupplyText === 'string') {
                savedSupplyText = savedSupplyText
                    .replace(/^"(.*)"$/, '$1')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
            }
        }

        const displayText = (savedSupplyText !== null && savedSupplyText !== undefined && savedSupplyText !== '')
            ? savedSupplyText
            : '아직 방학이라 준비물이 없습니다! 🏖️';

        if (adminSupplyText && adminSupplyText.value !== displayText) {
            adminSupplyText.value = displayText;
        }

        if (supplyContent) {
            const safeText = displayText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            supplyContent.innerHTML = `
                <div class="vacation-notice-box" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3);">
                    <i class="fa-solid fa-clipboard-check" style="color: #34d399; font-size: 28px; margin-bottom: 8px;"></i>
                    <h4 style="color: #f8fafc; font-size: 14px; font-weight: 700; margin-bottom: 6px;">오늘의 준비물 안내</h4>
                    <p style="white-space: pre-wrap; font-size: 12px; color: #e2e8f0; line-height: 1.5; margin: 0;">${safeText}</p>
                </div>
            `;
        }
    }

    renderSupplyUI();

    if (adminSupplyForm) {
        adminSupplyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                let supplyText = document.getElementById('adminSupplyText')?.value || '';
                // 이스케이프 기호가 중복 삽입되는 현상 방지 정화
                supplyText = supplyText.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                await saveToRemoteAndLocal('app_supply_text', supplyText);
                renderSupplyUI();
                alert('✅ 준비물 안내가 성공적으로 저장되었습니다!');
            } catch (err) {
                console.error('Supply Form Error:', err);
                alert(`⚠️ 준비물 저장 중 오류가 발생했습니다: ${err.message}`);
            }
        });
    }
    setupRemoteSync('app_supply_text', (remoteData) => {
        renderSupplyUI();
    });

    // --- 5. 포토갤러리 (최대 5장 저장 / FIFO 6번째 시 1번 자동 해제 / 좌우 화살표 + Dot 슬라이더) ---
    const adminGalleryFileInput = document.getElementById('adminGalleryFileInput');
    const adminGalleryImgUrl = document.getElementById('adminGalleryImgUrl');
    const adminGalleryImgPreview = document.getElementById('adminGalleryImgPreview');
    const galleryPreviewImgTag = document.getElementById('galleryPreviewImgTag');
    const galleryFileInfoText = document.getElementById('galleryFileInfoText');
    let uploadedGalleryImgSrc = '';
    let uploadedGalleryFileName = '';

    // 기본 5개 데모 사진
    const defaultGalleryItems = [
        { src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop', path: 'img/gallery_1.jpg', caption: '🌸 1학년 6반 즐거운 학교 생활' },
        { src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop', path: 'img/gallery_2.jpg', caption: '📚 함께 열공하는 신나는 교실 시간' },
        { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop', path: 'img/gallery_3.jpg', caption: '🤝 소중한 친구들과의 행복한 추억' },
        { src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600&auto=format&fit=crop', path: 'img/gallery_4.jpg', caption: '⚽ 신나는 학급 체육대회 한마당' },
        { src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600&auto=format&fit=crop', path: 'img/gallery_5.jpg', caption: '🚌 즐거웠던 현장체험학습 단체 사진' }
    ];

    // 갤러리 최신 등록 순서 (Newest First) 정렬 보장 헬퍼
    function ensureNewestFirstGallery(items) {
        if (!Array.isArray(items) || items.length <= 1) return items;

        const hasDates = items.every(it => it && it.date);
        if (hasDates) {
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return items;
        }

        // 기존 등록 데이터 중 오름차순(오래된 순)으로 남아있는 경우 최신순(내림차순)으로 반전
        const firstPath = items[0]?.path || items[0]?.src || '';
        const lastPath = items[items.length - 1]?.path || items[items.length - 1]?.src || '';
        if (firstPath.includes('gallery_1') || firstPath < lastPath) {
            items.reverse();
        }
        return items;
    }

    let galleryItems = JSON.parse(localStorage.getItem('app_gallery_items') || 'null');
    if (!galleryItems || galleryItems.length === 0) {
        galleryItems = defaultGalleryItems;
    }
    galleryItems = ensureNewestFirstGallery(galleryItems);
    localStorage.setItem('app_gallery_items', JSON.stringify(galleryItems));

    let galleryCurrentIndex = 0;

    function renderGallerySlider() {
        galleryItems = ensureNewestFirstGallery(galleryItems);

        const countTag = document.getElementById('adminGalleryCountTag');
        const mainCountBadge = document.getElementById('mainGalleryCountBadge');
        if (countTag) countTag.textContent = `(${galleryItems.length}/5장)`;
        if (mainCountBadge) mainCountBadge.textContent = `${galleryItems.length}/5장`;

        // 1. 관리자 그리드 렌더링 (최신 등록 사진이 1번으로 배치)
        const grid = document.getElementById('adminGalleryGrid');
        if (grid) {
            grid.innerHTML = galleryItems.map((item, i) => `
                <div class="admin-gallery-item-card">
                    <img src="${item.src}" alt="${item.caption}">
                    <button type="button" class="btn-delete-gallery-item" onclick="window.deleteGalleryItem(${i})">&times;</button>
                    <div class="admin-gallery-item-info">
                        <div class="admin-gallery-item-title">${i + 1}. ${item.caption} ${i === 0 ? '<span style="color:#10b981; font-size:10px; font-weight:700; margin-left:4px;">(최신)</span>' : ''}</div>
                        <div class="admin-gallery-item-path">${item.path || 'img/'}</div>
                    </div>
                </div>
            `).join('');
        }

        // 2. 메인 UI 갤러리 슬라이더 렌더링 (#mainGallerySliderBox)
        const sliderBox = document.getElementById('mainGallerySliderBox');
        if (!sliderBox) return;

        if (galleryItems.length === 0) {
            sliderBox.innerHTML = `
                <div class="vacation-notice-box" style="margin: 10px 0;">
                    <i class="fa-solid fa-images" style="font-size: 28px; color: #38bdf8; margin-bottom: 8px; display: block;"></i>
                    <h4 style="font-size: 14px; font-weight: 700; color: #fbbf24; margin-bottom: 4px;">아직 등록된 학급 사진이 없습니다 📸</h4>
                </div>`;
            return;
        }

        if (galleryCurrentIndex >= galleryItems.length) galleryCurrentIndex = 0;

        sliderBox.innerHTML = `
            <div class="gallery-carousel-viewport" id="galleryCarouselViewport">
                <button type="button" class="gallery-carousel-nav-btn prev" id="galleryPrevBtn" aria-label="이전 사진">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>

                <div class="gallery-carousel-track" id="galleryCarouselTrack" style="transform: translateX(-${galleryCurrentIndex * 100}%);">
                    ${galleryItems.map((item, idx) => `
                        <div class="gallery-carousel-slide" data-src="${item.src}" data-caption="${item.caption}">
                            <img src="${item.src}" alt="${item.caption}">
                            <div class="gallery-slide-caption">
                                <strong>${idx + 1}. ${item.caption}</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button type="button" class="gallery-carousel-nav-btn next" id="galleryNextBtn" aria-label="다음 사진">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            <!-- 하단 Dot 페이지네이션 -->
            <div class="gallery-carousel-dots" id="galleryCarouselDots">
                ${galleryItems.map((_, idx) => `
                    <span class="gallery-dot ${idx === galleryCurrentIndex ? 'active' : ''}" data-idx="${idx}" title="${idx + 1}번째 사진"></span>
                `).join('')}
            </div>
        `;

        // 슬라이더 버튼 & Dot 이벤트 연결
        const prevBtn = document.getElementById('galleryPrevBtn');
        const nextBtn = document.getElementById('galleryNextBtn');
        const dots = sliderBox.querySelectorAll('.gallery-dot');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                galleryCurrentIndex = (galleryCurrentIndex - 1 + galleryItems.length) % galleryItems.length;
                updateGallerySliderPosition();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                galleryCurrentIndex = (galleryCurrentIndex + 1) % galleryItems.length;
                updateGallerySliderPosition();
            });
        }
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(dot.getAttribute('data-idx'), 10);
                galleryCurrentIndex = idx;
                updateGallerySliderPosition();
            });
        });

        // 스마트폰/모바일 디바이스 좌우 터치 스와이프 (Touch Swipe) 제스처 처리
        const viewport = document.getElementById('galleryCarouselViewport');
        if (viewport) {
            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;
            let isSwiping = false;

            viewport.addEventListener('touchstart', (e) => {
                if (!e.touches || e.touches.length === 0) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                endX = startX;
                endY = startY;
                isSwiping = false;
            }, { passive: true });

            viewport.addEventListener('touchmove', (e) => {
                if (!e.touches || e.touches.length === 0) return;
                endX = e.touches[0].clientX;
                endY = e.touches[0].clientY;
                const diffX = Math.abs(endX - startX);
                const diffY = Math.abs(endY - startY);
                if (diffX > 10 || diffY > 10) {
                    isSwiping = true;
                }
            }, { passive: true });

            viewport.addEventListener('touchend', () => {
                const diffX = endX - startX;
                const diffY = endY - startY;

                // 좌우 드래그 거리가 35px 이상이고 가로 스와이프 의도가 명확할 때 작동
                if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX < 0) {
                        // 왼쪽으로 슬라이드 터치 -> 다음 사진
                        galleryCurrentIndex = (galleryCurrentIndex + 1) % galleryItems.length;
                    } else {
                        // 오른쪽으로 슬라이드 터치 -> 이전 사진
                        galleryCurrentIndex = (galleryCurrentIndex - 1 + galleryItems.length) % galleryItems.length;
                    }
                    updateGallerySliderPosition();
                }
            });

            // 사진 탭 터치 라이트박스 팝업 연동 (스와이프 이동 중이 아닐 때만 확대 팝업 실행)
            const slides = viewport.querySelectorAll('.gallery-carousel-slide');
            slides.forEach(slide => {
                slide.addEventListener('click', (e) => {
                    if (isSwiping) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                    const src = slide.getAttribute('data-src');
                    const caption = slide.getAttribute('data-caption');
                    if (typeof window.openLightbox === 'function' && src) {
                        window.openLightbox(src, caption);
                    }
                });
            });
        }
    }

    function updateGallerySliderPosition() {
        const track = document.getElementById('galleryCarouselTrack');
        const dots = document.querySelectorAll('.gallery-dot');
        if (track) {
            track.style.transform = `translateX(-${galleryCurrentIndex * 100}%)`;
        }
        dots.forEach((d, i) => {
            if (i === galleryCurrentIndex) d.classList.add('active');
            else d.classList.remove('active');
        });
    }

    window.deleteGalleryItem = async function (idx) {
        try {
            galleryItems.splice(idx, 1);
            await saveToRemoteAndLocal('app_gallery_items', galleryItems);
            renderGallerySlider();
        } catch (err) {
            console.error('Delete Gallery Item Error:', err);
        }
    };

    if (adminGalleryFileInput) {
        adminGalleryFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('⚠️ 파일 용량이 10MB를 초과합니다!\n10MB 이하의 이미지 파일만 업로드할 수 있습니다.');
                    adminGalleryFileInput.value = '';
                    if (adminGalleryImgPreview) adminGalleryImgPreview.style.display = 'none';
                    return;
                }

                uploadedGalleryFileName = `img/${file.name}`;
                try {
                    uploadedGalleryImgSrc = await compressImageFile(file, 1000, 1000, 0.75);
                    if (galleryPreviewImgTag) galleryPreviewImgTag.src = uploadedGalleryImgSrc;
                    if (galleryFileInfoText) galleryFileInfoText.textContent = `✅ 저장 준비 완료: ${uploadedGalleryFileName} (웹 최적화 완료)`;
                    if (adminGalleryImgPreview) adminGalleryImgPreview.style.display = 'block';
                } catch (err) {
                    console.error('Gallery Image Compression Error:', err);
                    alert('⚠️ 이미지 파일 처리 중 오류가 발생했습니다.');
                }
            }
        });
    }

    if (adminGalleryForm) {
        adminGalleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const caption = document.getElementById('adminGalleryCaption')?.value || '1학년 6반 추억 사진';
                const customUrl = adminGalleryImgUrl?.value.trim();

                const finalSrc = uploadedGalleryImgSrc || customUrl;
                const finalPath = uploadedGalleryFileName || customUrl;

                if (!finalSrc) {
                    alert('⚠️ 이미지 파일 첨부 또는 이미지 URL을 입력해주세요.');
                    return;
                }

                // 최신 등록 순서 (Newest First): 새 사진을 맨 앞(unshift)에 추가!
                galleryItems.unshift({ src: finalSrc, path: finalPath, caption: caption, date: new Date().toISOString() });

                // 최대 5장 유지 / 6번째 시 가장 오래된 사진(맨 끝 항목 pop) 자동 삭제
                if (galleryItems.length > 5) {
                    const removedItem = galleryItems.pop();
                    console.log('최대 5장 제한으로 가장 오래된 사진 자동 해제됨:', removedItem);
                }

                await saveToRemoteAndLocal('app_gallery_items', galleryItems);

                galleryCurrentIndex = 0; // 최신 등록 사진 (첫 번째 슬라이드)으로 이동
                renderGallerySlider();

                alert('✅ 갤러리에 새 사진이 최신 등록 순서로 성공적으로 등록되었습니다! (최대 5장 유지)');

                uploadedGalleryImgSrc = '';
                uploadedGalleryFileName = '';
                if (adminGalleryFileInput) adminGalleryFileInput.value = '';
                if (adminGalleryImgUrl) adminGalleryImgUrl.value = '';
                if (adminGalleryCaption) adminGalleryCaption.value = '';
                if (adminGalleryImgPreview) adminGalleryImgPreview.style.display = 'none';
            } catch (err) {
                console.error('Gallery Submit Error:', err);
                alert(`⚠️ 사진 등록 중 오류가 발생했습니다: ${err.message}`);
            }
        });
    }
    renderGallerySlider();
    setupRemoteSync('app_gallery_items', (remoteData) => {
        if (Array.isArray(remoteData)) {
            galleryItems = ensureNewestFirstGallery(remoteData);
            renderGallerySlider();
        }
    });

    // 6. 사용자 접속 및 조회 트래커 (Local Analytics)
    function trackAnalytics() {
        let totalVisits = parseInt(localStorage.getItem('app_total_visits') || '1284', 10);
        let todayVisits = parseInt(localStorage.getItem('app_today_visits') || '42', 10);
        totalVisits++;
        todayVisits++;
        localStorage.setItem('app_total_visits', totalVisits);
        localStorage.setItem('app_today_visits', todayVisits);

        const statTotal = document.getElementById('statTotalVisits');
        const statToday = document.getElementById('statTodayVisits');
        if (statTotal) statTotal.innerHTML = `${totalVisits.toLocaleString()}<small>회</small>`;
        if (statToday) statToday.innerHTML = `${todayVisits}<small>명</small>`;
    }
    trackAnalytics();

    // 멀티탭 및 어드민 실시간 데이터 동기화 리스너
    window.addEventListener('storage', (e) => {
        if (e.key === 'app_exam_list' && typeof renderExamUI === 'function') {
            renderExamUI();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
