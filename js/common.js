
async function loadComponent(url, containerId, repeatCount = 1) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ID not found: ${containerId}`);
        return;
    }

    // fetch 이용하여 HTML 불러오기
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlContent = await response.text();

        // 반복 횟수
        for (let i = 0; i < repeatCount; i++) {
            container.insertAdjacentHTML('beforeend', htmlContent);
        }

    } catch (error) {
        console.error(`Failed to load component ${url}:`, error);
        container.innerHTML = `<p style="color:red;">Error loading ${url}</p>`;
    }
}

// 컴포넌트 로드(Git 배포 오류 시 index.html에 base 태그과 함께 활성화)
const requiredComponents = [
    loadComponent('./components/sidebar.html', 'sidebar-container', 1),
    loadComponent('./components/story-item.html', 'story-item-container', 5),
    loadComponent('./components/post-card.html', 'post-card-container', 3),
    loadComponent('./components/profile-post-card.html', 'profile__feed-item-container', 8),
    
    // 추천 사용자 로드 + 내부 아이템 로드 (컴포넌트화가 필요한 줄 알았으나 필요 X -> 추후 수정 예정)
    loadComponent('./components/recommended-users.html', 'recommended-users-container', 1)
        .then(() => {
            return loadComponent('components/recommended-item.html', 'recommended-users__item-container', 5);
        })
];
// 컴포넌트 로드(Git배포 오류 없을 시 활성화 base 태그 주석처리할 것)
// const requiredComponents = [
//     loadComponent('../components/sidebar.html', 'sidebar-container', 1),
//     loadComponent('../components/story-item.html', 'story-item-container', 5),
//     loadComponent('../components/post-card.html', 'post-card-container', 3),
//     loadComponent('../components/profile-post-card.html', 'profile__feed-item-container', 8),
   
//     // 추천 사용자 로드 + 내부 아이템 로드 (컴포넌트화가 필요한 줄 알았으나 필요 X -> 추후 수정 예정)
//     loadComponent('../components/recommended-users.html', 'recommended-users-container', 1)
//         .then(() => {
//             return loadComponent('components/recommended-item.html', 'recommended-users__item-container', 5);
//         })
// ];

// Promise 사용하여 렌더링 보장(모달이벤트핸들러 등을 위함)
Promise.all(requiredComponents)
    .then(() => {
        console.log("All essential components loaded. Attaching event handlers.");
    })
    .catch(error => {
        console.error("One or more components failed to load:", error);
    });