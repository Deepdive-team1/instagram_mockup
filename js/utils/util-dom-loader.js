export async function loadComponent(url, containerId, repeatCount = 1) {
    const container = document.getElementById(containerId);
    // 컨테이너가 없으면(예: 모바일에서 데스크탑 영역 숨김 등) 조용히 종료
    if (!container) return; 

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
        const html = await res.text();

        for (let i = 0; i < repeatCount; i++) {
            container.insertAdjacentHTML('beforeend', html);
        }
    } catch (err) {
        console.error(`[Load Error] ${url}`, err);
        container.innerHTML = `<p style="color:red; font-size:12px;">Load Failed: ${url}</p>`;
    }
}