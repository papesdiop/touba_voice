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
    recInterval,
    recordsDirectory;

document.addEventListener("deviceready", onDeviceReady, false);

/** Records directory creation **/
function onGetDirectorySuccess(dir) {
    recordsDirectory = dir;
    //console.log("Created dir "+ dir);
}

function onGetDirectoryFail(error) {
    //alert("Error creating directory" + error.code);
}
var entry;
function onRequestFileSystemSuccess(fileSystem) {
    entry=fileSystem.root;
    entry.getDirectory("touba_voice/", {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail);
}

function success(entries) {
    var i;
    var objectType;
    for (i=0; i<entries.length; i++) {
        if(entries[i].isDirectory == true) {
            objectType = 'Directory';
        } else {
            objectType = 'File';
        }
        $('#directoryList').append('<li><h3>' + entries[i].name +
            '</h3><p>' + entries[i].toURI() + '</p><p class="ui-li-aside">Type:<strong>' + objectType + '</strong></p></li>');
    }
    $('#directoryList').listview("refresh");
}

function onDeviceReady($scope, Data) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null);
}

/**End**/


toubaApp
    .controller('PlayerCtrl', function($scope, Data){
        $scope.data = Data;

        var playerPrepare = function () {
            $('#player').bind('touchstart', function (){
                entry.getDirectory("touba_voice/", {create: false, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail);
                var directoryReader = entry.createReader()
                // Get a list of all the entries in the directory
                directoryReader.readEntries(success, null);
            });
        };

        playerPrepare()
    })
    .controller('RecordCtrl', function($scope, $modal, $log, Data){
        $scope.data = Data;
        $scope.max = 100;

        var recordPrepare = $scope.recordPrepare = function () {
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

        src = 'touba_voice/'
        src += ((Data.fileName==null||Data.fileName === 'undefined') ? 'recording_' + Math.round(new Date().getTime()/1000) : Data.fileName);
        src += Data.ext;

        var recordAudio =  function($scope, Data) {
            $('#record').unbind();
            $('#record').html('Stop recording');
            $('#recordDone').bind('touchstart', function() {
                stopRecording();
            });

            audioRecording = new Media(src, onSuccess, onError);
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
                        $('#message').html(Math.round(maxTime - recTime) + ' seconds remaining...');
                        var per = 100-((100/maxTime) * recTime);
                        $( "#progressbar" ).progressbar({
                            value: per
                        });
                        /*$( "#progressbar" ).on( "progressbarcomplete", function( event, ui ) {

                        } );*/
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
           // $("#progressbar").empty()
            $("#progressbar" ).progressbar( "destroy" );
            //$("#recordDone").unbind()
        }

        function uploadRecord(){
            $("#message").html("<p>Uploading record</p>");
            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = Data.fileName; //fileLocation.substr(src.lastIndexOf('/')+1);
            options.mimeType = "audio/mpeg"; //audio/mpeg    audio/x-wav
            options.chunkedMode = false;
            var fileTransfer = new FileTransfer();
            fileTransfer.upload(
                src,
                "http://localhost:3000/records", // Remote server for uploading record
                fileUploaded,
                onError,
                options
            );
        }

        function fileUploaded(result) {
            $("#message").html('<p>Upload complete!!<br />Bytes sent: ' + result.bytesSent + '</p>');
            //$("#returnMessage").attr("src", result.response);
        }

        function onSuccess() {
            $('#message').html('Audio file successfully created:<br />' + src);
        }

        function onError(error) {
            $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
        }

    })