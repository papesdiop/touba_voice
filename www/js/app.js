/**
 * Created by papesdiop on 2/3/14.
 */
var toubaApp = angular.module('toubaApp', [/*'ui.bootstrap',*/'ui.router','ngResource']);

toubaApp.config(function($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/signin");
    //
    // Now set up the states
    $stateProvider
        .state('signin', {
            url: "/signin",
            templateUrl: "partials/signin.html"
        })
        .state('content', {
            url: "/content",
            templateUrl: "partials/content.html"
        })
        .state('content.recorder', {
            url: "/recorder",
            templateUrl: "partials/content.recorder.html"
        })
        .state('content.player', {
            url: "/player",
            templateUrl: "partials/content.player.html",
            controller: 'PlayerCtrl'
        })
});

toubaApp.factory('Data', function(){
    return {
        fileName: 'My Recording',
        ext: '.mp3', //file extension .mp3, .wav
        maxTime : 10, // Max time for record in seconde
        //countdownInt : 3,
        src:null
    }
})

var maxTime = 1000, // Max time for record in seconde
    src,
    audioRecording,
    stopRecording,
    recInterval,
    directory,
    reader,
    SERVER_ADDRESS = 'http://toubavoiceserver-software.rhcloud.com';

document.addEventListener("deviceready", onDeviceReady, false);

/** Records directory creation **/
function onRequestFileSystemSuccess(fileSystem) {
    var entry=fileSystem.root;
    entry.getDirectory("touba_voice/", {create: true, exclusive: false},
        function (dir) {
            console.log("Created dir "+ dir.name);
            directory = dir;
            reader = dir.createReader();
        }
        ,function (error) {
        //alert("Error creating directory" + error.code);
    });
}

function onDeviceReady($scope, Data) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null);
}

/**End**/

toubaApp.factory('RecordRest', ['$resource',
    function($resource){
        return $resource(SERVER_ADDRESS+'/records/:id', {Id: "@Id" }, {
            query: {method:'GET', params:{}, isArray:true}
        });
    }]);

toubaApp
    .controller('PlayerCtrl', function($scope, $resource, Data, RecordRest){
       $scope.records = RecordRest.query() ;

        if($scope.records===null||$scope.records.length===0){
        reader.readEntries(
                function (entries) {
                    console.log("The dir has "+entries.length+" entries.");
                    // Scan for audio src
                    for (var i=0; i<entries.length; i++) {
                        console.log(entries[i].name+' dir? '+entries[i].isDirectory);
                        $scope.records.push({'fileName':entries[i].name})
                        if(entries[i].name == src) {
                            console.log("file found");
                        }
                    }
                },
                function (error) {
                    alert('onError(): '    + error.code    + '\n' +
                        'message: ' + error.message + '\n');
                })
        }

        var audioMedia = null,
            audioTimer = null,
            duration = -1,
            is_paused = false;

        $("#playLocalAudio").bind('touchstart', function() {
            stopAudio();
            var srcLocal = '/android_asset/www/434921-1gtndm8.mp3';
            playAudio(srcLocal);
        });
        $("#playRemoteAudio").bind('touchstart', function() {
            stopAudio();
            var srcRemote = 'http://toubavoiceserver-software.rhcloud.com/test.mp3';
            playAudio(srcRemote);
        });
        $("#pauseaudio").bind('touchstart', function() {
            pauseAudio();
        });
        $("#stopaudio").bind('touchstart', function() {
            stopAudio();
        });

        function playAudio(src) {
            if (audioMedia === null) {
                $("#mediaDuration").html("0");
                $("#audioPosition").html("Loading...");
                audioMedia = new Media(src, onSuccess, onError);
                audioMedia.play();
            } else {
                if (is_paused) {
                    is_paused = false;
                    audioMedia.play();
                }
            }
            if (audioTimer === null) {
                audioTimer = setInterval(function() {
                    audioMedia.getCurrentPosition(
                        function(position) {
                            if (position > -1) {
                                setAudioPosition(Math.round(position));
                                if (duration <= 0) {
                                    duration = audioMedia.getDuration();
                                    if (duration > 0) {
                                        duration = Math.round(duration);
                                        $("#mediaDuration").html(duration);
                                    }
                                }
                            }
                        },
                        function(error) {
                            console.log("Error getting position=" + error);
                            setAudioPosition("Error: " + error);
                        }
                    );
                }, 1000);
            }
        }

        function pauseAudio() {
            if (is_paused) return;
            if (audioMedia) {
                is_paused = true;
                audioMedia.pause();
            }
        }

        function stopAudio() {
            if (audioMedia) {
                audioMedia.stop();
                audioMedia.release();
                audioMedia = null;
            }
            if (audioTimer) {
                clearInterval(audioTimer);
                audioTimer = null;
            }
            is_paused = false;
            duration = 0;
        }

        function setAudioPosition(position) {
            $("#audioPosition").html(position + " sec");
        }

        function onSuccess() {
            setAudioPosition(duration);
            clearInterval(audioTimer);
            audioTimer = null;
            audioMedia = null;
            is_paused = false;
            duration = -1;
        }
        function onError(error) {
            alert('code: ' + error.code + '\n' + 'message: ' + error.source + '\n');
            clearInterval(audioTimer);
            audioTimer = null;
            audioMedia = null;
            is_paused = false;
            setAudioPosition("0");
        }

    })
    .controller('RecordCtrl', function($scope, $modal, $log, Data){
        $scope.data = Data;
        $scope.max = 100;

        var recordPrepare = $scope.recordPrepare = function () {
            $('#prepareRecord').attr("disabled", false);
            $('#record').unbind();
            $('#record').html('Start recording');
            $('#record').bind('touchstart', function (){
                $( "#dialog-modal" ).dialog( "close" );
                recordAudio($scope, Data);
            });
            $( "#dialog-modal" ).dialog({
                autoOpen: false,
                width: 350,
                modal: true
            });
            $( "#prepareRecord" )
                .button()
                .click(function() {
                    $( "#dialog-modal" ).dialog( "open" );
                });
        };

        function stopRecording() {
            $("#progressbar" ).progressbar( "destroy" );
            $('#message').html('Audio file successfully created:<br />' + src);
            clearInterval(recInterval);
            audioRecording.stopRecord();
            recordPrepare();
        }

        var recordAudio =  function($scope, Data) {
            //$('#prepareRecord').attr("disabled", true);
            $('#record').unbind();
            $('#record').html('Stop recording');
            $('#stop').bind('touchstart', function() {
                stopRecording();
            });
            src = 'touba_voice/'
            src += ((Data.fileName==null||Data.fileName === 'undefined') ? 'recording_' + Math.round(new Date().getTime()/1000) : Data.fileName)+Data.ext;
            audioRecording = new Media(src, onSuccess, onError);
            Data.countdownInt = 3;
            var startCountdown = setInterval(function() {
                $('#message').html('Recording will start in ' + Data.countdownInt + ' seconds...');
                Data.countdownInt = Data.countdownInt -1;
                if(Data.countdownInt <= 0) {
                    Data.countdownInt = 3;
                    clearInterval(startCountdown);
                    audioRecording.startRecord();
                    var recTime = maxTime;
                    recInterval = setInterval(function() {
                        recTime = recTime - 1;
                        var timeRun = maxTime - recTime
                        $('#message').html(Math.floor(timeRun/60) +':' + timeRun%60);
                        var progress = 100-((100/maxTime) * recTime);
                        $( "#progressbar" ).progressbar({
                            value: progress
                        });
                        $( "#progressbar" ).on( "progressbarcomplete", function( event, ui ) {
                                //alert('Max time reached')
                        } );
                        if (recTime <= 0) {
                            stopRecording();
                        }
                    }, 1000);
                }
            }, 1000);
        }

        function onSuccess() {
            $('#message').html('Audio file successfully created:<br />' + src);
            //send(src); //will be removed TODO
        }

        function send(recordURI) {
            console.log('RECORD URI : ' + recordURI);
            $("#message").html("<p>Sending "+recordURI+"</p>");
            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = Data.fileName + Data.ext; //recordURI.substr(src.lastIndexOf('/')+1);
            options.mimeType = Data.ext==='.mp3'?"audio/mpeg":"audio/x-wav"; //audio/mpeg    audio/x-wav
            options.chunkedMode = false;
            var fileTransfer = new FileTransfer();
            /*fileTransfer.onprogress = function(progressEvent) {
                if (progressEvent.lengthComputable) {
                    //loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
                    var progress = 100-((100/progressEvent.total) * progressEvent.loaded );
                    $( "#progressbar" ).progressbar({
                        value: progress
                    });
                } else {
                    //loadingStatus.increment();
                }
            };*/
            fileTransfer.upload(
                '/sdcard/'+recordURI,
                SERVER_ADDRESS+'/records', // Remote server for uploading record
                fileUploaded,
                onError,
                options
            );
            //$('#message').html('Audio file successfully sent:<br />' + src);
        }

        function fileUploaded(result) {
            $("#message").html('<p>Upload complete!!<br />Bytes sent: ' + result.bytesSent + '</p>');
            //$("#returnMessage").attr("src", result.response);
        }

        function onError(error) {
            $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
            console.dir(error)
        }

    })