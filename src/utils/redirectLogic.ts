export const handleShopeeRedirect = () => {
    // Check if Mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const KEY = 'shopee_click_count';
    let currentCount = 0;

    try {
        currentCount = parseInt(localStorage.getItem(KEY) || '0', 10);
    } catch (e) {
        currentCount = 0;
    }

    const newCount = currentCount + 1;
    localStorage.setItem(KEY, newCount.toString());

    // Trigger on 1st click, then every 10th click (1, 11, 21...)
    // Strategy: 1st time -> Redirect.
    // Next 9 times -> No redirect.
    // 11th time -> Redirect.
    if (newCount === 1 || (newCount - 1) % 10 === 0) {
        // Use window.open for new tab
        window.open('https://s.shopee.vn/50Sh3Hc3iI', '_blank');
    }
};
