/**
 * Created by papesdiop on 2/3/14.
 */
var toubaApp = angular.module('toubaApp', ['ui.bootstrap']);

toubaApp
    .controller('TabsCtrl', function ($scope) {
        $scope.tabs = [
            { title:"RECORDER", content:"Dynamic content 1" },
            { title:"PLAYER", content:"Dynamic content 2", disabled: false }
        ];

        $scope.alertMe = function() {
            setTimeout(function() {
                alert("You've selected the alert tab!");
            });
        };

        $scope.navType = 'pills';
    })