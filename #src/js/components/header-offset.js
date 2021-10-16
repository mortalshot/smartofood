// ===== HEADER OFFSET START =====
const headerWrapper = document.querySelectorAll('.header .content-wrapper');
const bodyNav = document.querySelectorAll('.body_nav');

if (headerWrapper.length > 0) {
    const headerWrapperHeight = headerWrapper[0].clientHeight;
    const headerWrapperDilator = document.querySelectorAll('.header_dilator');
    headerWrapperDilator[0].style.height = headerWrapperHeight + 'px';
}

if (bodyNav.length > 0) {
    const bodyNavHeight = bodyNav[0].clientHeight;
    const bodyNavDilator = document.querySelectorAll('.body_nav-dilator');
    bodyNavDilator[0].style.height = bodyNavHeight + 'px';
}

window.addEventListener('resize', function (event) {
    if (headerWrapper.length > 0) {
        const headerWrapperHeight = headerWrapper[0].clientHeight;
        const headerWrapperDilator = document.querySelectorAll('.header_dilator');
        headerWrapperDilator[0].style.height = headerWrapperHeight + 'px';
    }

    if (bodyNav.length > 0) {
        const bodyNavHeight = bodyNav[0].clientHeight;
        const bodyNavDilator = document.querySelectorAll('.body_nav-dilator');
        bodyNavDilator[0].style.height = bodyNavHeight + 'px';
    }
})
// ===== HEADER OFFSET END =====