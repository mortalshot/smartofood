let windowScrollTop = window.pageYOffset;
const homeTemplateHorisontal = document.querySelector('.home-template');
const header = document.querySelector('.header');

if (homeTemplateHorisontal && header) {
    const bodyNav = document.querySelector('.body_nav');

    if (windowScrollTop > 0) {
        bodyNav.classList.add('_scrolled');
        header.classList.add('_scrolled');
    }

    window.addEventListener('scroll', function () {
        let windowScrollTop = window.pageYOffset;

        if (windowScrollTop > 0) {
            bodyNav.classList.add('_scrolled');
            header.classList.add('_scrolled');
        } else {
            bodyNav.classList.remove('_scrolled');
            header.classList.remove('_scrolled');
        }
    })
}