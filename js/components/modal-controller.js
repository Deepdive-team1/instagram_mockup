// 모달 열기/닫기 및 데이터 바인딩 담당
export async function openPostModal(postId) {
    const modal = document.getElementById('post-detail-modal');
    const contentWrapper = document.getElementById('post-modal-content-wrapper');
    
    if (!modal || !contentWrapper) return;

    // 1. 모달 표시 (로딩 중)
    modal.classList.add('post-modal--active');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 막기
    contentWrapper.innerHTML = '<p style="padding:20px;">Loading...</p>';

    try {
        // 2. 데이터 찾기 (feed.json에서 ID로 검색)
        const dataRes = await fetch('./assets/data/feed.json');
        const feedData = await dataRes.json();
        // 문자열/숫자 형변환 주의 (== 사용)
        const post = feedData.posts.find(p => p.id == postId);

        if (!post) throw new Error('Post not found');

        // 3. 템플릿 가져오기
        const templateRes = await fetch('./components/post-modal.html');
        let html = await templateRes.text();

        // 4. 데이터 바인딩 (단순 치환)
        html = html.replace(/{{mediaUrl}}/g, post.mediaUrl)
                   .replace(/{{author.username}}/g, post.author.username)
                   .replace(/{{author.profileImageUrl}}/g, post.author.profileImageUrl)
                   .replace(/{{caption}}/g, post.caption);

        // 5. DOM 삽입
        contentWrapper.innerHTML = html;

        // 6. 닫기 버튼 이벤트 연결 (동적으로 생성된 버튼이므로 여기서 연결)
        const closeBtn = contentWrapper.querySelector('.post-modal__close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closePostModal());
        }

    } catch (error) {
        console.error(error);
        contentWrapper.innerHTML = '<p>Error loading content</p>';
    }
}

export function closePostModal() {
    const modal = document.getElementById('post-detail-modal');
    if (modal) {
        modal.classList.remove('post-modal--active');
        document.body.style.overflow = ''; // 스크롤 복원
    }
}

// 배경 클릭 시 닫기 (이벤트 위임)
document.addEventListener('click', (e) => {
    const modal = document.getElementById('post-detail-modal');
    if (e.target === modal) {
        closePostModal();
    }
});