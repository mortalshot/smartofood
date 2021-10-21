// ===== HEADER OFFSET START =====
const headerWrapper = document.querySelectorAll('.header .header_container');
let headerHeight = headerWrapper[0].clientHeight;
const headerWrapperDilator = document.querySelectorAll('.header_dilator');

const bodyNav = document.querySelectorAll('.body_nav');
let bodyNavHeight = bodyNav[0].clientHeight;
const bodyNavDilator = document.querySelectorAll('.body_nav-dilator');

let windowScrollTop = window.pageYOffset;

if (headerWrapper.length > 0) {
    setDilatorHeight(headerWrapper[0], headerHeight, headerWrapperDilator[0]);
}

if (bodyNav.length > 0) {
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