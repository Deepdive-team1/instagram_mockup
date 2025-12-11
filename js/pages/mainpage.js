import { loadComponent } from '../utils/util-dom-loader.js';
import { openPostModal } from '../components/modal-controller.js';

export async function initMainPage() {
    // 1. 뼈대 컴포넌트 로드
    await Promise.all([
        loadComponent('./components/responsive-header.html', 'responsive-header-container'),
        loadComponent('./components/sidebar.html', 'sidebar-container'),
        loadComponent('./components/recommended-users.html', 'recommended-users-container'),
        loadComponent('./components/footer-nav.html', 'footer-nav-container')
    ]);

    // 2. 초기 홈 화면 렌더링
    await restoreHomePage();

    // 3. 기능 연결
    setupResponsiveHeader(); // 모바일 헤더 하트 버튼
    setupNavigationEvents(); // ★ 홈 버튼 + 로고 버튼 연결 (이제 함수가 있어서 작동함!)
}

/**
 * [Home Restore] 메인 컨텐츠(스토리+피드)를 다시 그리는 함수
 */
async function restoreHomePage() {
    const mainContainer = document.querySelector('main');
    
    // HTML 구조 초기화
    mainContainer.innerHTML = `
        <div class="story-wrapper">
            <button id="prevBtn" class="nav-btn prev-btn"><</button>
            <div id="story-item-container" class="story-item-container"></div>
            <button id="nextBtn" class="nav-btn next-btn">></button>
        </div>
        <div id="post-card-container" class="post-card-container"></div>
    `;

    // 데이터 다시 로드
    await Promise.all([
        renderStories(),
        renderFeed()
    ]);

    // 스토리 스크롤 재연결
    setupStoryNavigation();
}

/**
 * [Navigation] 홈 버튼 & 로고 클릭 이벤트 처리
 * ★ 아까 빠져있던 함수입니다. 오타 수정된 ID를 적용했습니다.
 */
function setupNavigationEvents() {
    // 1. 홈 버튼들 (사이드바 + 하단바)
    const homeBtns = document.querySelectorAll('#nav-home-btn');
    
    // 2. 로고 버튼들 찾기
    // ★ 오타 수정된 ID 반영: responsive-logo-btn
    // (혹시 몰라 클래스 이름으로도 찾게 2중 안전장치를 걸었습니다)
    const mobileLogo = document.getElementById('responsive-logo-btn') || document.querySelector('.responsive-header__logo');
    const sidebarLogo = document.getElementById('sidebar-logo-btn') || document.querySelector('.sidebar__logo');

    // 공통 동작: 홈 복구 + 스크롤 최상단 이동
    const goHome = async () => {
        await restoreHomePage();
        window.scrollTo(0, 0);
    };

    // 이벤트 연결
    homeBtns.forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', goHome);
    });
    
    if (mobileLogo) {
        mobileLogo.style.cursor = 'pointer';
        mobileLogo.addEventListener('click', goHome);
    }

    if (sidebarLogo) {
        sidebarLogo.style.cursor = 'pointer';
        sidebarLogo.addEventListener('click', goHome);
    }
}

// -----------------------------------------------------------
// [기존 렌더링 함수들]
// -----------------------------------------------------------

async function renderStories() {
    const container = document.getElementById('story-item-container');
    if (!container) return;
    try {
        const userRes = await fetch('https://randomuser.me/api/?results=10'); 
        const userData = await userRes.json();
        const templateRes = await fetch('./components/story-item.html');
        const template = await templateRes.text();
        userData.results.forEach(user => {
            let html = template;
            html = html.replace(/{{profileImageUrl}}/g, user.picture.medium)
                       .replace(/{{username}}/g, user.login.username);
            container.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) { console.error("Story Load Error:", error); }
}

async function renderFeed() {
    const container = document.getElementById('post-card-container');
    if (!container) return;
    try {
        const [userRes, templateRes] = await Promise.all([
            fetch('https://randomuser.me/api/?results=5'),
            fetch('./components/post-card.html')
        ]);
        const userData = await userRes.json();
        const template = await templateRes.text();
        userData.results.forEach((user, index) => {
            let html = template;
            const postId = index + 1;
            const randomLikes = Math.floor(Math.random() * 2000) + 100;
            const randomImage = `https://picsum.photos/600/750?random=${postId}`; 
            
            html = html.replace(/{{author.profileImageUrl}}/g, user.picture.medium)
                       .replace(/{{author.username}}/g, user.login.username)
                       .replace(/{{mediaUrl}}/g, randomImage)
                       .replace(/{{likesCount}}/g, randomLikes)
                       .replace(/{{createdAt}}/g, `${index + 1}시간 전`)
                       .replace(/{{caption}}/g, `오늘의 사진! ${user.location.city}에서. #daily`);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const postElement = tempDiv.firstElementChild;
            postElement.dataset.postId = postId;

            postElement.addEventListener('click', (e) => {
                if (!e.target.closest('.post-card__icon-bar')) {
                    openPostModal(postId); 
                }
            });

            const likeBtn = postElement.querySelector('.post-card__like-button');
            if (likeBtn) likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                likeBtn.classList.toggle('active');
                const icon = likeBtn.querySelector('i');
                if (likeBtn.classList.contains('active')) {
                    icon.classList.replace('bi-heart', 'bi-heart-fill');
                    icon.style.color = 'red';
                } else {
                    icon.classList.replace('bi-heart-fill', 'bi-heart');
                    icon.style.color = 'inherit';
                }
            });

            const saveBtn = postElement.querySelector('.post-card__save-button');
            if (saveBtn) saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                saveBtn.classList.toggle('active');
                const icon = saveBtn.querySelector('i');
                if (saveBtn.classList.contains('active')) {
                    icon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
                } else {
                    icon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
                }
            });

            container.appendChild(postElement);
        });
    } catch (error) { console.error("Feed Render Error:", error); }
}

function setupStoryNavigation() {
    const storyContainer = document.getElementById('story-item-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (!storyContainer || !prevBtn || !nextBtn) return;
    const handleButtonVisibility = () => {
        const scrollLeft = storyContainer.scrollLeft;
        const maxScrollLeft = storyContainer.scrollWidth - storyContainer.clientWidth;
        prevBtn.style.display = scrollLeft <= 2 ? 'none' : 'flex'; 
        nextBtn.style.display = scrollLeft >= maxScrollLeft - 2 ? 'none' : 'flex';
    };
    prevBtn.addEventListener('click', () => {
        storyContainer.scrollBy({ left: -storyContainer.clientWidth, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
        storyContainer.scrollBy({ left: storyContainer.clientWidth, behavior: 'smooth' });
    });
    storyContainer.addEventListener('scroll', handleButtonVisibility);
    setTimeout(handleButtonVisibility, 200);
}

function setupResponsiveHeader() {
    const heartBtn = document.getElementById('responsive-heart-btn');
    if (!heartBtn) return; 
    heartBtn.addEventListener('click', async () => {
        const icon = heartBtn.querySelector('i');
        if (icon) {
            icon.classList.replace('bi-heart', 'bi-heart-fill');
            icon.style.color = 'black'; 
        }
        const mainContainer = document.querySelector('main');
        if(mainContainer) {
            try {
                const res = await fetch('./components/activity.html'); 
                if(res.ok) {
                    const html = await res.text();
                    mainContainer.innerHTML = html; 
                    window.scrollTo(0, 0);
                } else {
                    mainContainer.innerHTML = `<div style="padding:20px;text-align:center;"><h2>알림</h2><p>activity.html 없음</p></div>`;
                }
            } catch (e) { console.error(e); }
        }
    });
}