document.addEventListener("click", documentActions);

function documentActions(e) {
    const targetElement = e.target;

    // HEADER_CITY ACTIONS START
    if (document.querySelector('.header .header_city')) {
        if (targetElement.classList.contains('header_city') || targetElement.closest('.header_city')) {
            document.querySelector('.header .header_city').classList.toggle('_active');
        } else if (!targetElement.closest('.header_city')) {
            document.querySelector('.header .header_city').classList.remove('_active');
        }
    }
    // HEADER_CITY ACTIONS END

    // BURGER BUTTON ACTION START
    if (document.querySelector('.header_hamburger')) {
        if (targetElement.classList.contains('header_hamburger') || targetElement.closest('.header_hamburger')) {
            document.querySelector('.header_hamburger').classList.toggle('_active');
            document.querySelector('#navigation').classList.toggle('opened'); //!need to remove
        }

        //!need to remove
        if (targetElement.classList.contains('close-block')  || targetElement.closest('.close-block')) {
            document.querySelector('.header_hamburger').classList.toggle('_active');
            document.querySelector('#navigation').classList.remove('opened'); //!need to remove
        }
    }
    // BURGER BUTTON ACTION END
}