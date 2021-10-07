const homeSlider = document.querySelectorAll('.home-slider');

if (homeSlider.length > 0) {
    mainBanners = new Swiper('.home-slider', {
        slidesPerView: 1,
        spaceBetween: 10,
        watchOverflow: true,
        autoHeight: false,
        preloadImages: false,
        
        lazy: {
            loadOnTransitionStart: true,
            loadPrevNext: true,
        },

        pagination: {
            el: '.home-slider .swiper-pagination',
            clickable: true,
        },

        navigation: {
            prevEl: '.home-slider .swiper__button-prev',
            nextEl: '.home-slider .swiper__button-next',
        },
    });

    const homeSlider = document.querySelectorAll('.home-slider');
    if (homeSlider.length > 0) {
        for (let index = 0; index < homeSlider.length; index++) {
            const element = homeSlider[index];
            const elementLength = element.querySelectorAll('.home-slider__item').length;

            if (elementLength <= 1) {
                element.classList.add('_without-controlls')
            }
        }
    }
};