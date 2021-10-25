// ===== HEADER OFFSET START =====
const headerWrapper = document.querySelectorAll('.header .header_container');
const headerWrapperDilator = document.querySelectorAll('.header_dilator');

const bodyNav = document.querySelectorAll('.body_nav');
const bodyNavDilator = document.querySelectorAll('.body_nav-dilator');

let windowScrollTop = window.pageYOffset;

if (headerWrapper.length > 0) {
    let headerHeight = headerWrapper[0].clientHeight;
    setDilatorHeight(headerWrapper[0], headerHeight, headerWrapperDilator[0]);
}

if (bodyNav.length > 0) {
    let bodyNavHeight = bodyNav[0].clientHeight;
    setDilatorHeight(bodyNav[0], bodyNavHeight, bodyNavDilator[0]);
}

function setDilatorHeight(element, elementHeight, dilator) {
    element.style.height = elementHeight + 'px';
    dilator.style.height = elementHeight + 'px';
};

if (windowScrollTop > 0) {
    document.body.classList.add('_scrolled');
};
// ===== HEADER OFFSET END =====