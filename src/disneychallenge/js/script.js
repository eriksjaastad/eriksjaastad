(function ($) {
	var currentYear = (new Date).getFullYear();
	var itemList = ['Gabriel Ba','John Adams','Keith Richards','Prince','John Adams McKensie'];


	$(document).ready(function() {
		$("#copyRight").text((new Date).getFullYear());

		list = itemList.sort();
		elm = "";
		$.each(list, function(index, value) {
			elm += "<li id=" + index + ">" + value + "</li>";
		});
		$("#names").append(elm);
		listc = $("#names");
		listc.on('click', "li", function() {
			$(this).toggleClass("strike")
		})
	});


	//Challenge 5: Array Max
	var a = [[141,151,161], 2, 3, [101, 202, [303,404]]];
	var b =[];
	$.fn.flatten = function() {
	    if(typeof e.length !="undefined") {
	        for (var i=0; i<e.length; i++) {
	            flatten(e[i],b);
	        }
	    } else {
	        b.push(e);
	    }
		b.sort(function(a, b){return b-a});
		console.log(b[0]);
	};


	//Challenge 6 Strings
	function longest(){
	    var args = Array.prototype.slice.call(arguments, 0);
	    var largs = args.sort(function(a,b) {
	        return b.length - a.length;
	    })[0];
	    var n = largs.length;
	    console.log(n);
	}
	
	            

	//Challenge 4: Walues and Timing
	function countdown(num) {
	    for (var i=0; i<=num; i++) {
	        setTimeout(function(x) {
	            return function() {
	                console.log(x);
	            };
	        }((i+1) + ': ' + (num - i)), 1000*i);
	    }
	}
	


	//Challenge 7 Validation
	function validatePhone(Phone) {
	    try {
	        var filter = /^\d([- ]*\d){6,11}$/;
	        if (!filter.test(Phone)) throw "Invalid phone number";
	    } catch(e) {
	        alert(e);
	        return false;
	    } 
	    var p = Phone.replace(/[ -]+/g, "");
	        alert(p);
	        return true;	    
	}

}(jQuery));

$("#ch4").countdown(5));
$("#ch5").flatten(a,b));
$("#ch6").on('click', longest("a", "aapaa", "ajhgklkjha"));
$("#ch7").on('click', validatePhone("01-234 567 8912"));
