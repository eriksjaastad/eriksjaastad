<html>
    <head>
        <title>Ash Photography</title>
        <link rel="stylesheet" href="css/reset.css" type="text/css" />
        <link rel="stylesheet" href="css/styles.css" type="text/css" />
        <link rel="stylesheet" href="css/isotope.css" type="text/css" />
        
        <!-- webfonts -->
        <link href='http://fonts.googleapis.com/css?family=Lato:400,700,300' rel='stylesheet' type='text/css'>
        
        <!-- JS Libraries -->
        <!--[if lt IE 9]><script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script src="/js/isotope/jquery.isotope.min.js"></script>
         
         
         <!-- JS Code Blocks -->
         <script type="text/javascript">
            jQuery(document).ready(function($){
                /* prepend menu icon */
                $('#site-nav').prepend('<div id="menu-icon">MENU</div>');

                /* toggle nav */
                $("#menu-icon").on("click", function(){
                    $("#nav-menu").slideToggle();
                    $(this).toggleClass("active");
                });
            });
        </script>
        <script type="text/javascript">
            $('#recent-shoots').isotope({
                // options
                itemSelector : '.shoot',
                layoutMode : 'fitRows'
            });

            /*$('#recent-shoots').isotope({ filter: '.my-selector' }, function( $items ) {
                var id = this.attr('id'),
                    len = $items.length;
                console.log( 'Isotope has filtered for ' + len + ' items in #' + id );
            });*/
        </script>
    </head>
    <body>
    
    