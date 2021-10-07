requirejs.config({
    baseUrl: '/assets/js/lib',
    paths: {
        jquery: 'jquery.min',
        jui: 'jquery-ui.min',
        app: 'app' + (appEnv === 'prod' ? '.min' : ''),
        mask: 'jquery.mask.min',
        swal: 'sweetalert2.min',
        rangeslider: 'ion.rangeSlider.min',
        banners: 'banners'
    },
    waitSeconds: 15,
    urlArgs: 'ver=' + appVersion
});