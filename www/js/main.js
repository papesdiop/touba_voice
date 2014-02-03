/**
 * Created by papesdiop on 2/3/14.
 */
var toubaApp = angular.module('toubaApp', ['ui.bootstrap']);

toubaApp.controller('AlertDemoCtrl', function AlertDemoCtrl($scope) {
    $scope.alerts = [
        { type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
        { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
    ];

    $scope.addAlert = function() {
        $scope.alerts.push({msg: "Another alert!"});
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

})