document.addEventListener("click", documentActions);

function documentActions(e) {
    const targetElement = e.target;

    // HEADER_CITY ACTIONS START
    if (targetElement.classList.contains('header_city') || targetElement.closest('.header_city')) {
        document.querySelector('.header .header_city').classList.toggle('_active');
    } else if (!targetElement.closest('.header_city')) {
        document.querySelector('.header .header_city').classList.remove('_active');
    }
    // HEADER_CITY ACTIONS END

    // BURGER BUTTON ACTION START
    if (targetElement.classList.contains('header_hamburger') || targetElement.closest('.header_hamburger')) {
        document.querySelector('.header_hamburger').classList.toggle('_active');
        document.querySelector('#navigation').classList.toggle('opened'); //!need remove
    } else if (!targetElement.closest('.header_hamburger')) {
        document.querySelector('.header_hamburger').classList.remove('_active');
        document.querySelector('#navigation').classList.remove('opened'); //!need remove
    }
    // BURGER BUTTON ACTION END
}