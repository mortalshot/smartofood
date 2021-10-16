const hiddenBlock = document.querySelectorAll('.block-hidden');

if (hiddenBlock.length > 0) {
    for (let index = 0; index < hiddenBlock.length; index++) {
        const element = hiddenBlock[index];
        const link = element.querySelector('.block-hidden__link');
        const wrapper = element.querySelector('.block-hidden__wrapper');

        link.addEventListener('click', function(e) {
            e.preventDefault();

            element.classList.add("_show");
        })
    }
}