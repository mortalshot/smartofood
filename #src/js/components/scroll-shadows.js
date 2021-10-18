let elementWrapper = document.querySelector('.dropdown_list-wrapper');
let elementList = document.querySelector('.dropdown_list');
let shadowTop = elementWrapper.querySelector('.shadow--top');
let shadowBottom = elementWrapper.querySelector('.shadow--bottom');

let contentScrollHeight = elementList.scrollHeight - elementWrapper.offsetHeight;

if (contentScrollHeight <= 0) {
    shadowBottom.style.opacity = 0;
}

elementList.addEventListener('scroll', function (e) {
    let currentScroll = this.scrollTop / (contentScrollHeight);

    shadowTop.style.opacity = currentScroll;
    shadowBottom.style.opacity = 1 - currentScroll;
})
