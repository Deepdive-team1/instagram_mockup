// myprofile.js
export function initMyProfile() {
    console.log("내 프로필 페이지가 로드되었습니다.");

    // 예시: 탭 클릭 이벤트 같은 걸 여기에 작성하면 됩니다.
    const tabs = document.querySelectorAll('.tab-item');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 기존 active 제거
            tabs.forEach(t => t.classList.remove('active'));
            // 현재 클릭 active 추가
            tab.classList.add('active');
            
            // 나중에 탭별 컨텐츠 전환 로직 추가 가능
            console.log(tab.innerText + " 탭 클릭됨");
        });
    });

    // 프로필 편집 버튼 이벤트 예시
    const editBtn = document.querySelector('.btn-secondary');
    if(editBtn) {
        editBtn.addEventListener('click', () => {
            alert("프로필 편집 기능은 아직 준비 중입니다!");
        });
    }
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
}