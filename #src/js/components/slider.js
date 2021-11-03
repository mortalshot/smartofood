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

    for (let index = 0; index < homeSlider.length; index++) {
        const element = homeSlider[index];
        const elementLength = element.querySelectorAll('.home-slider__item').length;

        if (elementLength <= 1) {
            element.classList.add('_without-controlls')
        }
    }
};

const ingredients = document.querySelectorAll('.ingredients__slider');
if (ingredients.length > 0) {
    const ingredientsSlider = new Swiper('.ingredients__slider', {
        slidesPerView: 2,
        spaceBetween: 16,
        watchOverflow: true,
        autoHeight: false,
        preloadImages: false,

        lazy: {
            loadOnTransitionStart: true,
            loadPrevNext: true,
        },

        navigation: {
            prevEl: '.ingredients__slider .swiper__button-prev',
            nextEl: '.ingredients__slider .swiper__button-next',
        },

        breakpoints: {
            450: {
                slidesPerView: 3,
            },
            575: {
                slidesPerView: 4,
            },
            768: {
                slidesPerView: 5,
            },
        },

        on: {
            lock: function () {
                this.el.classList.add('_lock');
            },
        },
    });
}

const template1Suggest = document.querySelectorAll('.template1 .load_suggest');
if (template1Suggest.length > 0) {
    const suggestSlider = new Swiper('.load_suggest .swiper', {
        slidesPerView: 1,
        spaceBetween: 10,
        watchOverflow: true,
        autoHeight: false,
        preloadImages: false,

        lazy: {
            loadOnTransitionStart: true,
            loadPrevNext: true,
        },

        navigation: {
            prevEl: '.load_suggest .swiper__button-prev',
            nextEl: '.load_suggest .swiper__button-next',
        },

        breakpoints: {
            450: {
                slidesPerView: 2,
                spaceBetween: 16,
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 16,
            },
            992: {
                slidesPerView: 4,
                spaceBetween: 20,
            },
            1250: {
                slidesPerView: 4,
                spaceBetween: 28,
            },
        },

        on: {
            lock: function () {
                this.el.classList.add('_lock');
            },
        },
    });
}

const template2Suggest = document.querySelectorAll('.template2 .load_suggest');
if (template2Suggest.length > 0) {
    const suggestSlider = new Swiper('.load_suggest .swiper', {
        slidesPerView: 1,
        spaceBetween: 10,
        watchOverflow: true,
        autoHeight: false,
        preloadImages: false,

        lazy: {
            loadOnTransitionStart: true,
            loadPrevNext: true,
        },

        navigation: {
            prevEl: '.load_suggest .swiper__button-prev',
            nextEl: '.load_suggest .swiper__button-next',
        },

        breakpoints: {
            475: {
                slidesPerView: 2,
                spaceBetween: 16,
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 16,
            },
            1150: {
                slidesPerView: 4,
                spaceBetween: 20,
            },
        },

        on: {
            lock: function () {
                this.el.classList.add('_lock');
            },
        },
    });
}