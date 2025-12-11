import { initMainPage } from './pages/mainpage.js';

// DOM이 준비되면 바로 실행
document.addEventListener('DOMContentLoaded', () => {
    initMainPage().catch(err => console.error("Router Error:", err));
});