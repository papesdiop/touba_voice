var SERVER_ADDRESS = 'http://toubavoiceserver-software.rhcloud.com';

var module1 = angular.module('RecordService', ['ngResource']).factory('Record', ['$resource', function ($resource) {
    var Record = $resource(SERVER_ADDRESS+'/records', {}, {
        update: { method: 'PUT'}
    });
    return Record;
}]);