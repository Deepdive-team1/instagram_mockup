/**
 * [Modal Controller]
 * 클릭한 게시물의 데이터를 받아서 모달에 표시
 */
export function openPostModal(postData) {
    const modal = document.getElementById('post-modal-backdrop');
    const closeBtn = document.getElementById('modal-close-btn');

    if (!modal) return;

    // 1. 데이터 주입 (제공해주신 클래스명 기준)
    
    // 메인 이미지
    const mainImg = modal.querySelector('.modal-main-img');
    if(mainImg) mainImg.src = postData.postImage;

    // 프로필 이미지들 (헤더 + 본문)
    const profileImgs = modal.querySelectorAll('.modal-profile-img');
    profileImgs.forEach(img => img.src = postData.userImage);

    // 유저네임들
    const usernames = modal.querySelectorAll('.modal-username-text');
    usernames.forEach(span => span.textContent = postData.username);

    // 본문 내용
    const captionText = modal.querySelector('.modal-caption-text');
    if(captionText) captionText.textContent = postData.caption;
    
    // 시간
    const timeText = modal.querySelector('.modal-time-text');
    if(timeText) timeText.textContent = postData.time;

    // 좋아요 수
    const likesText = modal.querySelector('.modal-likes-count');
    if(likesText) likesText.textContent = `좋아요 ${postData.likes}개`;

    // 2. 모달 열기
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 배경 스크롤 막기

    // 3. 닫기 이벤트
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}