const mediaQueryLgMax = window.matchMedia('(max-width: 991px)');
mediaQueryLgMax.addListener(handleTabletChangeLgMax);

function handleTabletChangeLgMax(e) {
    const bodyNav = document.querySelectorAll('.body_nav');
    const headerWrapper = document.querySelectorAll('.content-wrapper');

    if (e.matches) {
        // ===== HEADER OFFSET START =====
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
        // ===== HEADER OFFSET END =====
    }

    else {
    }
}

handleTabletChangeLgMax(mediaQueryLgMax);