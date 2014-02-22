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

var module1 = angular.module('RecordService', ['ngResource']).factory('Record', ['$resource', function ($resource) {
    var Record = $resource(SERVER_ADDRESS+'/records', {}, {
        update: { method: 'PUT'}
    });
    return Record;
    }])
    .factory('Data', function(){
        return {
            fileName: 'My Recording',
            ext: '.mp3', //file extension .mp3, .wav
            maxTime : 10, // Max time for record in seconde
            src:null
        }
    })