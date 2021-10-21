const mediaQueryLgMin = window.matchMedia('(min-width: 992px)');
mediaQueryLgMin.addListener(handleTabletChangeLgMax);

function handleTabletChangeLgMax(e) {
    if (e.matches) {
        window.addEventListener('scroll', function () {
            let windowScrollTop = window.pageYOffset;
        
            if (document.querySelector('.home-template').classList.contains('template2')) {
                if (windowScrollTop > 0) {
                    headerWrapper[0].style.height = headerHeight - 40 + "px";
                    headerWrapperDilator[0].style.height = headerHeight - 40 + "px";
        
                    bodyNav[0].style.top = headerHeight - 40 + "px";
                } else {
                    headerWrapper[0].style.height = headerHeight + "px";
                    headerWrapperDilator[0].style.height = headerHeight + "px";
        
                    bodyNav[0].style.top = headerHeight + "px";
                }
            }
        });
    }

    else {

    }
}

handleTabletChangeLgMax(mediaQueryLgMin);