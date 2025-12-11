import { loadComponent } from '../utils/util-dom-loader.js';
import { openPostModal } from '../components/modal-controller.js';

let isFetching = false;

// 1. 초기화
export async function initMainPage() {
    await Promise.all([
        loadComponent('./components/responsive-header.html', 'responsive-header-container'),
        loadComponent('./components/sidebar.html', 'sidebar-container'),
        loadComponent('./components/recommended-users.html', 'recommended-users-container'),
        loadComponent('./components/footer-nav.html', 'footer-nav-container'),
        loadComponent('./components/post-modal.html', 'modal-root')
    ]); 
    
    await restoreHomePage();
    setupResponsiveHeader();
    setupNavigationEvents();
    window.addEventListener('scroll', handleInfiniteScroll);
}

// 2. 무한 스크롤 핸들러
function handleInfiniteScroll() {
    // 프로필 페이지가 떠있을 땐 무한 스크롤 중단
    const isProfilePage = document.querySelector('.profile-container') || document.querySelector('.my-profile-wrapper');
    
    if (!isProfilePage) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
            renderFeed(true);
        }
    }
}

// 3. 홈 화면 복구 (뒤로 가기 시 호출됨)
async function restoreHomePage() {
    const mainContainer = document.querySelector('main');
    mainContainer.innerHTML = `
        <div class="story-wrapper">
            <button id="prevBtn" class="nav-btn prev-btn"><</button>
            <div id="story-item-container" class="story-item-container"></div>
            <button id="nextBtn" class="nav-btn next-btn">></button>
        </div>
        <div id="post-card-container" class="post-card-container"></div>
    `;

    // 피드와 스토리를 다시 불러옵니다
    await Promise.all([renderStories(), renderFeed(false)]);
    setupStoryNavigation();
}

/**
 * ★ [내 프로필] 로드 함수 (myprofile)
 */
async function loadMyProfilePage() {
    const mainContainer = document.querySelector('main');
    
    try {
        // 1. HTML 가져오기
        const res = await fetch('./components/myprofile.html');
        if(!res.ok) throw new Error("myprofile.html 로드 실패");
        const html = await res.text();
        
        mainContainer.innerHTML = html;
        window.scrollTo(0,0);

        // 2. CSS 동적 로드 (styles/myprofile.css)
        if (!document.getElementById('myprofile-css')) {
            const link = document.createElement('link');
            link.id = 'myprofile-css';
            link.rel = 'stylesheet';
            link.href = './styles/myprofile.css'; 
            document.head.appendChild(link);
        }

        // 3. JS 동적 로드
        try {
            const module = await import('../components/myprofile.js');
            if (module && module.initMyProfile) {
                module.initMyProfile(); 
            }
        } catch (jsError) {
            console.warn("myprofile.js 로드 실패:", jsError);
        }

    } catch(e) {
        alert("내 프로필 로딩 실패: " + e.message);
    }
}

/**
 * ★ [남의 프로필] 로드 함수 (profile)
 * - 여기서도 CSS 경로를 확실하게 잡아줘야 화면이 안 날라갑니다!
 */
async function loadUserProfile(userData) {
    const mainContainer = document.querySelector('main');
    
    try {
        // 1. HTML 가져오기
        const res = await fetch('./components/profile.html');
        if (!res.ok) throw new Error("profile.html 로드 실패");
        
        const html = await res.text();
        mainContainer.innerHTML = html; 
        window.scrollTo(0, 0); 

        // 2. ★ CSS 동적 로드 (여기가 중요!) ★
        // 아까 말씀하신 styles/components/profile.css 경로를 여기에도 적용합니다.
        if (!document.getElementById('other-profile-css')) {
            const link = document.createElement('link');
            link.id = 'other-profile-css';
            link.rel = 'stylesheet';
            link.href = './styles/components/profile.css'; // 경로 확인해주세요!
            document.head.appendChild(link);
        }

        // 3. 데이터 바인딩 (기존 로직 복구)
        const setText = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };
        const setImg = (id, src) => { const el = document.getElementById(id); if(el) el.src = src; };

        setImg('p-avatar', userData.userImage);
        setText('p-username', userData.username);
        setText('p-realname', userData.username);
        setText('p-nav-username', userData.username);
        setText('p-posts-count', Math.floor(Math.random() * 50) + 10);
        setText('p-followers', Math.floor(Math.random() * 5000) + 100);
        setText('p-following', Math.floor(Math.random() * 500) + 10);

        const backBtn = document.getElementById('profile-back-btn');
        if (backBtn) backBtn.onclick = () => restoreHomePage();

        // 하이라이트 스토리
        const storyContainer = document.getElementById('profile-story-container');
        if (storyContainer) {
            const storyRes = await fetch('./components/story-item.html');
            const storyTemplate = await storyRes.text();
            for(let i=1; i<=5; i++) {
                let sHtml = storyTemplate;
                sHtml = sHtml.replace(/{{profileImageUrl}}/g, `https://picsum.photos/200/200?random=${i*500}`)
                             .replace(/{{username}}/g, i === 1 ? '신규' : `하이라이트 ${i-1}`);
                storyContainer.insertAdjacentHTML('beforeend', sHtml);
            }
        }

        // 갤러리
        const gallery = document.getElementById('p-gallery');
        if (gallery) {
            for(let i=0; i<9; i++) {
                const postImgUrl = `https://picsum.photos/600/600?random=${Date.now()+i}`;
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.innerHTML = `<img src="${postImgUrl}" alt="post">`;
                div.onclick = () => openPostModal({
                    ...userData, 
                    postImage: postImgUrl,
                    caption: '프로필 갤러리 게시물',
                    likes: 123,
                    time: '1일 전'
                });
                gallery.appendChild(div);
            }
        }

    } catch (e) {
        console.error("Profile Load Failed", e);
    }
}


// 4. 스토리 렌더링
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
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const storyEl = tempDiv.firstElementChild;
            storyEl.addEventListener('click', () => loadUserProfile({
                username: user.login.username,
                userImage: user.picture.medium
            }));
            
            container.appendChild(storyEl);
        });
    } catch (error) { console.error(error); }
}

// 5. 피드 렌더링
async function renderFeed(isAppend = false) {
    if (isFetching) return;
    isFetching = true;
    const container = document.getElementById('post-card-container');
    if (!container) { isFetching = false; return; }

    try {
        const [userRes, templateRes] = await Promise.all([
            fetch('https://randomuser.me/api/?results=10'), 
            fetch('./components/post-card.html')
        ]);
        const userData = await userRes.json();
        const template = await templateRes.text();
        
        if (!isAppend) container.innerHTML = '';

        userData.results.forEach((user, index) => {
            const uniqueId = Date.now() + index; 
            const postData = {
                id: uniqueId,
                username: user.login.username,
                userImage: user.picture.medium,
                postImage: `https://picsum.photos/600/750?random=${uniqueId}`,
                likes: Math.floor(Math.random() * 2000) + 100,
                caption: `오늘의 기록! ${user.location.city}`,
                time: `3시간 전`
            };

            let html = template;
            html = html.replace(/{{author.profileImageUrl}}/g, postData.userImage)
                        .replace(/{{author.username}}/g, postData.username)
                        .replace(/{{mediaUrl}}/g, postData.postImage)
                        .replace(/{{likesCount}}/g, postData.likes)
                        .replace(/{{createdAt}}/g, postData.time)
                        .replace(/{{caption}}/g, postData.caption);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const postElement = tempDiv.firstElementChild;

            const imgArea = postElement.querySelector('.post-image') || postElement.querySelector('img[alt="post content"]');
            if (imgArea) {
                imgArea.style.cursor = 'pointer';
                imgArea.addEventListener('click', () => openPostModal(postData));
            }

            const profileLinks = postElement.querySelectorAll('.profile-pic, .username');
            profileLinks.forEach(el => {
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    loadUserProfile(postData);
                });
            });

            setupPostButtons(postElement);
            container.appendChild(postElement);
        });
    } catch (e) { console.error(e); } 
    finally { isFetching = false; }
}

// 버튼 이벤트 분리
function setupPostButtons(el) {
    const likeBtn = el.querySelector('.post-card__like-button');
    if(likeBtn) likeBtn.onclick = (e) => {
        e.stopPropagation();
        likeBtn.classList.toggle('active');
        const i = likeBtn.querySelector('i');
        if(i) {
            i.className = likeBtn.classList.contains('active') ? 'bi bi-heart-fill' : 'bi bi-heart';
            i.style.color = likeBtn.classList.contains('active') ? 'red' : 'inherit';
        }
    }

    const saveBtn = el.querySelector('.post-card__save-button');
    if (saveBtn) {
        saveBtn.onclick = (e) => {
            e.stopPropagation(); 
            saveBtn.classList.toggle('active');
            const i = saveBtn.querySelector('i');
            if (i) {
                i.className = saveBtn.classList.contains('active') ? 'bi bi-bookmark-fill' : 'bi bi-bookmark';
            }
        };
    }
}

// ★ 네비게이션 설정 (이벤트 위임)
function setupNavigationEvents() {
    document.body.addEventListener('click', async (e) => {
        
        // 1. 내 프로필 버튼
        const profileBtn = e.target.closest('#nav-profile-btn');
        if (profileBtn) {
            e.preventDefault(); 
            console.log("내 프로필 이동");
            await loadMyProfilePage();
            return;
        }

        // 2. 홈 버튼
        const homeBtn = e.target.closest('#nav-home-btn, .responsive-header__logo, .sidebar__logo');
        if (homeBtn) {
            e.preventDefault(); 
            console.log("홈으로 이동");
            await restoreHomePage();
            window.scrollTo(0, 0);
            return;
        }
    });
}

// 스토리 스크롤
function setupStoryNavigation() {
    const c = document.getElementById('story-item-container');
    const p = document.getElementById('prevBtn');
    const n = document.getElementById('nextBtn');
    if(!c) return;
    if(p) p.onclick = () => c.scrollBy({left: -c.clientWidth, behavior:'smooth'});
    if(n) n.onclick = () => c.scrollBy({left: c.clientWidth, behavior:'smooth'});
}

// 반응형 헤더
function setupResponsiveHeader() { 
    const heartBtn = document.getElementById('responsive-heart-btn');
    if (!heartBtn) return; 
    heartBtn.addEventListener('click', async () => {
        const mainContainer = document.querySelector('main');
        if(mainContainer) {
            try {
                const res = await fetch('./components/activity.html'); 
                if(res.ok) {
                    mainContainer.innerHTML = await res.text(); 
                    window.scrollTo(0, 0);
                }
            } catch (e) { console.error(e); }
        }
    });
}