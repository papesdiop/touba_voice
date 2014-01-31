document.addEventListener("deviceready", onDeviceReady, false);
//Fix :active state on device
document.addEventListener("touchstart", function() {}, false);

var mediaPlayer;

function onDeviceReady() {
    navigator.splashscreen.hide();
    mediaPlayer = new MediaPlayer();
    mediaPlayer.run();
}

function MediaPlayer() {
}

MediaPlayer.prototype = {
    mediaContent : null,
    isPlaying : false,

    run: function() {
        var that = this,
            src = "http://audio.ibeat.org/content/p1rj1s/p1rj1s_-_rockGuitar.mp3";


        var playAudioButton = document.getElementById("buttonPlayAudio"),
            stopAudioButton = document.getElementById("buttonStopAudio"),
            pauseAudioButton = document.getElementById("buttonPauseAudio");

        playAudioButton.addEventListener("click",
            function() {
                that._play.apply(that, arguments)
            });

        stopAudioButton.addEventListener("click",
            function() {
                that._stop.apply(that, arguments)
            });

        pauseAudioButton.addEventListener("click",
            function() {
                that._pause.apply(that, arguments)
            });

        that.mediaContent = new Media(src,
            function() {
                that._onMediaSuccess.apply(that, arguments);
            },
            function() {
                that._onError.apply(that, arguments);
            },
            function() {
                that._onMediaStatusChanged.apply(that, arguments);
            });
    },

    _onMediaSuccess: function() {
        console.log("mediaSuccess");
    },

    _onError: function(error) {
        var errorMessage = "code: " + error.code + "\n" +
            "message: " + error.message + "\n";
        this._showMessage(errorMessage);
        this.isPlaying = false;
    },

    _onMediaStatusChanged: function(status) {
        if(status === Media.MEDIA_STOPPED) {
            this.mediaContent.release();
        }
    },

    _play: function() {
        if(this.isPlaying === false) {
            this.mediaContent.play();
            this._showMessage('Playing...');
            this.isPlaying = true;
        }
    },

    _pause: function () {
        if(this.isPlaying === true) {
            this.mediaContent.pause();
            this._showMessage('Paused');
            this.isPlaying = false;
        }
    },

    _stop: function () {
        this.mediaContent.stop();
        this._showMessage('');
        this.isPlaying = false;
    },

    _showMessage: function(text) {
        var statusBox = document.getElementById('result');
        statusBox.innerText = text;
    }
}