$(document).ready(function() {
    TweetManager.init();
});


var TweetManager = (function () {
    function init() {
        initHandlers();
    }

    function initHandlers() {
        resetUI();
        $("#lstType").on("change", function() {
            resetUI();
        });
        $("form select").on("change", function() {
            constructTweet();
        });

        $("form input").on("change", function() {
            constructTweet();
        });
    }

    function resetUI() {
        var type = $("#lstType option:selected").val();

        $("#pnlHospital").hide();
        $("#pnlItem").hide();
        if (type == "blood") {
            $("#pnlHospital").show();
            $("#txtHospital").val("Mallya Hospital, Vittal Mallya Road");
            $("#txtUnits").val("2");
            $("#txtCity").val("Bangalore");
            $("#txtPhone").val("9449052884");
        } else if (type == "ad") {
            $("#txtItem").val("Two tickets avl for CSK vs Dolphins CLT20 22-Sep-2014");
            $("#txtCity").val("Indira Nagar, Bangalore");
            $("#pnlItem").show();
        } if (type == "lost") {
            $("#txtItem").val("Black labrador missing from 19-Sep-2014");
            $("#txtCity").val("Koramangala, Bangalore");
            $("#pnlItem").show();
        }
        constructTweet();
    }

    function constructTweet() {
        var type = $("#lstType option:selected").val();
        var tweet = "";
        var virtualNumber = '09066021631 Ext:***';

        if (type == "blood") {
            var units = Number($("#txtUnits").val());
            var group = $("#lstGroup option:selected").html();
            var hospital = $("#txtHospital").val();
            var user = $("#txtUser").text();
            var phone = $("#txtPhone").val();

            tweet += "#" + $("#txtCity").val() + " ";
            tweet += " Need " + (units == 1 ? '' + group + ' ' : '' + units + ' units of ' + group + ' ');
            tweet += "#Blood @ " + hospital + " ";
            tweet += "Call: " + user + " " + virtualNumber;
        } else if (type == "ad") {
            var item = $("#txtItem").val();
            var city = $("#txtCity").val();
            var user = $("#txtUser").text();
            var phone = $("#txtPhone").val();

            tweet += "#Sale ";
            tweet += item + " Pickup: " + city + " ";
            tweet += "Call: " + user + " " + virtualNumber;
        } if (type == "lost") {
            var item = $("#txtItem").val();
            var city = $("#txtCity").val();
            var user = $("#txtUser").text();
            var phone = $("#txtPhone").val();

            tweet += "#Lost ";
            tweet += item + " Last seen @ " + city + " ";
            tweet += "Call: " + user + " " + virtualNumber;
        }
        //tweet += " #test";

        $("#txtTweet").val(tweet);
        $("#lblTweet").html("This new Tweet (" + tweet.length + " chars) will be posted on your Twitter profile.");
    }

    return {
        init: init
    }
})();