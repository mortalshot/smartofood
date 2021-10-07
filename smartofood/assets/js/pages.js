require(['lib/config.js'], function () {

    require(
        ['jquery', 'app', 'banners'],
        function ($, App, Banners) {
            $(function () {
                'use strict';

                App();

                if ($('.banners .banners__item').length > 1) {
                    Banners('.banners', {
                        isCycling: true,
                        interval: 7000
                    });
                }

                $('.text-container:not(.vis)').addClass('hidden');
                $('.text-container:not(.vis) .btn').on('click', function () {
                    $(this).parent().removeClass('hidden');
                });
            });
        });

});
