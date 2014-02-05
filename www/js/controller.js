/**
 * Created by papesdiop on 2/3/14.
 */
var toubaApp = angular.module('toubaApp', ['ui.bootstrap']);

toubaApp.factory('Data', function(){
    return {
        fileName: 'My Recording',
        maxTime : 10, // Max time for record in seconde
        countdownInt : 3,
        src:null,
        audioRecording:null,
        stopRecording:null,
        progress:1
    }
})

var maxTime = 10, // Max time for record in seconde
    //countdownInt = 3,
    src,
    audioRecording,
    stopRecording,
    recInterval;

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

function onDeviceReady($scope, Data) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null);
}

/**End**/


toubaApp
    .controller('RecordCtrl', function($scope, Data){
        $scope.data = Data;
        $scope.max = 100;
        var recordPrepare = $scope.recordPrepare = function () {
            $('#record').unbind();
            $('#record').html('Start recording');
            $('#record').bind('touchstart', function (){
                recordAudio($scope, Data)
            });
        };

        var recordAudio =  function($scope, Data) {
            $('#record').unbind();
            $('#record').html('Stop recording');
            $('#record').bind('touchstart', function() {
                stopRecording();
            });
            src = 'touba_voice/'
            src = src + ((Data.fileName==null||Data.fileName === 'undefined') ? 'recording_' + Math.round(new Date().getTime()/1000) + '.mp3': Data.fileName +'.mp3');
            audioRecording = new Media(src, onSuccess, onError);
            var startCountdown = setInterval(function() {
                $('#message').html('Recording will start in ' + Data.countdownInt + ' seconds...');
                Data.countdownInt = Data.countdownInt -1;
                if(Data.countdownInt <= 0) {
                    Data.countdownInt = 3;
                    clearInterval(startCountdown);
                    audioRecording.startRecord();
                    var recTime = 0;
                    recInterval = setInterval(function() {
                        recTime = recTime + 1;
                        $('#message').html(Math.round(maxTime - recTime) + ' seconds remaining...');
                        var prog = 100-((100/maxTime) * recTime);
                        $( "#progressbar" ).progressbar({
                            value: prog
                        });
                        if (recTime >= maxTime) {
                            clearInterval(recInterval);
                            stopRecording();
                        }
                    }, 1000);
                }
            }, 1000);
        }

        function stopRecording() {
            clearInterval(recInterval);
            audioRecording.stopRecord();
            recordPrepare();
            $( "#progressbar" ).progressbar({
                value: 0
            });
        }

        function onSuccess() {
            $('#message').html('Audio file successfully created:<br />' + src);
        }

        function onError(error) {
            $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
        }

    })