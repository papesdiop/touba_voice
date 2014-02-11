/**
 * Created by papesdiop on 2/3/14.
 */
var toubaApp = angular.module('toubaApp', ['ui.bootstrap','ui.router']);

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
            controller: function($scope) {
                $scope.records = ["AKASSA", "KARA", "MESSAGE DU CHEIKH", "AJABANI"];
            }
        })
});

toubaApp.factory('Data', function(){
    return {
        fileName: 'My Recording',
        ext: '.mp3', //file extension .mp3, .wav
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
    .controller('RecordCtrl', function($scope, $modal, $log, Data){
        $scope.data = Data;
        $scope.max = 100;

        var recordPrepare = $scope.recordPrepare = function () {
            $('#prepareRecord').attr("disabled", false);
            $('#record').unbind();
            $('#record').html('Start recording');
            $('#record').bind('touchstart', function (){
                recordAudio($scope, Data)
            });
        };

        $scope.open = function () {

            var modalInstance = $modal.open({
                templateUrl: 'fileModal',
                controller: ModalInstanceCtrl,
                resolve: {
                    data: function () {
                        return $scope.data;
                    }
                }
            });

            modalInstance.result.then(function (fileName) {
                $scope.data.fileName = fileName;
                $log.info('FileName saved as: ' + fileName);
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        var ModalInstanceCtrl = function ($scope, $modalInstance, data) {
            $scope.data = data
            $scope.ok = function () {
                $modalInstance.close($scope.data.fileName);
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        };

        var recordAudio =  function($scope, Data) {
            $('#prepareRecord').attr("disabled", true);
            $('#record').unbind();
            $('#record').html('Stop recording');
            $('#stop').bind('touchstart', function() {
                stopRecording();
            });
            src = 'touba_voice/'
            src = src + ((Data.fileName==null||Data.fileName === 'undefined') ? 'recording_' + Math.round(new Date().getTime()/1000) : Data.fileName);
            src += Data.ext;
            audioRecording = new Media(src, onSuccess(src), onError);
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
                        //$('#message').html(recTime + ' seconds remaining...');
                        var timeRun = maxTime - recTime
                        $('#message').html(Math.floor(timeRun/60) +':' + timeRun%60);
                        var prog = 100-((100/maxTime) * recTime);
                        $( "#progressbar" ).progressbar({
                            value: prog
                        });
                        $( "#progressbar" ).on( "progressbarcomplete", function( event, ui ) {
                                alert('Max time reached')
                        } );
                        if (recTime <= 0) {
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
            $("#progressbar" ).progressbar( "destroy" );
           // $("#progressbar").append("<a class='btn btn-primary btn-lg glyphicon glyphicon-saved' >DONE</a>");
        }

        function onSuccess(recordURI) {
            $("#message").html("<p>Uploading record</p>");
            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = Data.fileName; //fileLocation.substr(src.lastIndexOf('/')+1);
            options.mimeType = "audio/mpeg"; //audio/mpeg    audio/x-wav
            options.chunkedMode = false;
            var fileTransfer = new FileTransfer();
            fileTransfer.upload(
             recordURI,
             "http://192.168.2.63:3000/records", // Remote server for uploading record
             fileUploaded,
             onError,
             options
             );
            $('#message').html('Audio file successfully created:<br />' + src);
        }

        function fileUploaded(result) {
            $("#message").html('<p>Upload complete!!<br />Bytes sent: ' + result.bytesSent + '</p>');
            //$("#returnMessage").attr("src", result.response);
        }

        function onError(error) {
            $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
        }

    })