var maxTime = 10, // Max time for record in seconde
    countdownInt = 3,
    src,
    audioRecording,
    stopRecording;

document.addEventListener("deviceready", onDeviceReady, false);

/** Records directory creation **/
function onGetDirectorySuccess(dir) {
    console.log("Created dir "+ dir.name);
}

function onGetDirectoryFail(error) {
    //alert("Error creating directory" + error.code);
}
function onRequestFileSystemSuccess(fileSystem) {
    var entry=fileSystem.root;
    entry.getDirectory("touba_voice/", {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail);
}

function onDeviceReady() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null);
    recordPrepare();
}

/**End**/

function recordPrepare() {
    $('#record').unbind();
    $('#record').html('Start recording');
    $('#record').bind('touchstart', function() {
        recordAudio();
    });
}

function recordAudio() {
    $('#record').unbind();
    $('#record').html('Stop recording');
    $('#record').bind('touchstart', function() {
        stopRecording();
    });
    src = 'touba_voice/recording_' + Math.round(new Date().getTime()/1000) + '.mp3';
    audioRecording = new Media(src, onSuccess, onError);
    var startCountdown = setInterval(function() {
        $('#message').html('Recording will start in ' + countdownInt + ' seconds...');
        countdownInt = countdownInt -1;
        if(countdownInt <= 0) {
            countdownInt = 3;
            clearInterval(startCountdown);
            audioRecording.startRecord();
            var recTime = 0;
            recInterval = setInterval(function() {
                recTime = recTime + 1;
                $('#message').html(Math.round(maxTime - recTime) +
                    ' seconds remaining...');
                var progPerc = 100-((100/maxTime) * recTime);
                setProgress(progPerc);
                if (recTime >= maxTime) {
                    stopRecording();
                }
            }, 1000);
        }
    }, 1000);
}

function setProgress(progress) {
    $("#progressbar").progressbar({
        value: progress
    });
}

function stopRecording() {
    clearInterval(recInterval);
    audioRecording.stopRecord();
    setProgress(0);
    recordPrepare();
}

function onSuccess() {
    $('#message').html('Audio file successfully created:<br />' + src);
}

function onError(error) {
    $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
}