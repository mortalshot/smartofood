document.addEventListener('DOMContentLoaded', function () {
    @@include('index.js');

    const ingredientsButtons = document.querySelectorAll('.product_ingredients-btn');

    if (ingredientsButtons.length > 0) {
        for (let index = 0; index < ingredientsButtons.length; index++) {
            const element = ingredientsButtons[index];
            element.addEventListener('click', function () {
                document.querySelector('#mods-window').classList.add('opened');
            })
        }
    }
})