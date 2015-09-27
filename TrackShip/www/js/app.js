// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('trackship', ['ionic', 'ionic.service.core', 'ionic.service.push', 'ngCordova', 'trackship.controllers'])

.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })
  .config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider) {
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.navBar.alignTitle('center');
    $stateProvider
      .state('landing', {
        url: "/landing",
        templateUrl: "templates/landing.html"
      })
      .state('newproject', {
        url: "/projects/new",
        controller: "AddProjectCtrl",
        templateUrl: "templates/new-project.html",
      })
      .state('joinproject', {
        url: "/projects/join",
        controller: "AddProjectCtrl",
        templateUrl: "templates/join-project.html"
      });

    $urlRouterProvider.otherwise("/landing");
  });
