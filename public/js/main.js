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
            $("#txtPhone").val("09449052884");
        } else if (type == "ad") {
            $("#pnlItem").show();
        } if (type == "lost") {
            $("#pnlItem").show();
        }
        constructTweet();
    }

    function constructTweet() {
        var type = $("#lstType option:selected").val();
        var tweet = "";

        if (type == "blood") {
            var units = Number($("#txtUnits").val());
            var group = $("#lstGroup option:selected").html();
            var hospital = $("#txtHospital").val();
            var user = $("#txtUser").text();
            var phone = $("#txtPhone").val();

            tweet += "#" + $("#txtCity").val() + " ";
            tweet += " Need " + (units == 1 ? '' + group + ' ' : '' + units + ' units of ' + group + ' ');
            tweet += "#Blood @ " + hospital + " ";
            tweet += "Call: " + user + " " + phone;
        } else if (type == "ad") {
            
        } if (type == "lost") {
            
        }
        tweet += " #test";

        $("#txtTweet").val(tweet);
        $("#lblTweet").html("This new Tweet (" + tweet.length + " chars) will be posted on your Twitter profile.");
    }

    return {
        init: init
    }
})();