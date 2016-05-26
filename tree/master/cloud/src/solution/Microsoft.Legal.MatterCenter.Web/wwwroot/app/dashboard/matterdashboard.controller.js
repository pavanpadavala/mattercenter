﻿(function () {
    'use strict;'
    var app = angular.module("matterMain");
    app.controller('MatterDashBoardController', ['$scope', '$state', '$interval', '$stateParams', 'api', '$timeout', 'matterDashBoardResource', '$rootScope', 'uiGridConstants', '$location', '$http',
        function matterDashBoardController($scope, $state, $interval, $stateParams, api, $timeout, matterDashBoardResource, $rootScope, uiGridConstants, $location, $http) {
            var vm = this;
            vm.downwarddrop = true;
            vm.upwarddrop = false;
            vm.loadLocation = false;
            vm.AuthornoResults = false;
            vm.clientdrop = false;
            vm.clientdropvisible = false;
            vm.pgdrop = false;
            vm.pgdropvisible = false;
            vm.aoldrop = false;
            vm.aoldropvisible = false;
            vm.checkClient = false;
            vm.sortbydrop = false;
            vm.sortbydropvisible = false;
            vm.sortbytext = 'None';
            //#endregion
            //#region Variable to show matter count            
            vm.allMatterCount = 0;
            vm.myMatterCount = 0;
            vm.pinMatterCount = 0;
            vm.pinorUnPinImage = "../Images/pin-666.png"
            vm.Pinnedobj = [];
            //#endregion            

            //#region closing all dropdowns on click of page
            vm.closealldrops = function () {
                vm.searchdrop = false;
                vm.downwarddrop = true;
                vm.upwarddrop = false;
                vm.clientdrop = false;
                vm.clientdropvisible = false;
                vm.pgdrop = false;
                vm.pgdropvisible = false;
                vm.aoldrop = false;
                vm.aoldropvisible = false;
                vm.sortbydrop = false;
                vm.sortbydropvisible = false;
            }
            //#endregion

            //#region closing and hiding innerdropdowns of search box
            vm.hideinnerdrop = function ($event) {
                $event.stopPropagation();
                vm.clientdrop = false;
                vm.clientdropvisible = false;
                vm.pgdrop = false;
                vm.pgdropvisible = false;
                vm.aoldrop = false;
                vm.aoldropvisible = false;
            }
            //#endregion


            var gridOptions = {
                paginationPageSize: 10,
                enableGridMenu: false,
                enableRowHeaderSelection: false,
                enableRowSelection: true,
                enableSelectAll: false,
                multiSelect: false,
                enableColumnMenus: false,
                enableFiltering: false
            }


            //#region Matter Grid functionality
            vm.matterGridOptions = {
                paginationPageSize: gridOptions.paginationPageSize,
                enableGridMenu: gridOptions.enableGridMenu,
                enableRowHeaderSelection: gridOptions.enableRowHeaderSelection,
                enableRowSelection: gridOptions.enableRowSelection,
                enableSelectAll: gridOptions.enableSelectAll,
                multiSelect: gridOptions.multiSelect,
                enableFiltering: gridOptions.enableFiltering,
                columnDefs: [
                    { field: 'matterName', width: '20%', displayName: 'Matter', cellTemplate: '../app/dashboard/MatterDashboardCellTemplate.html', enableColumnMenu: false },
                    { field: 'matterClient', width: '15%', displayName: 'Client', cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.matterClient}}</div>', enableColumnMenu: false },
                    { field: 'matterClientId', width: '15%', displayName: 'Client.Matter ID', headerTooltip: 'Click to sort by client.matterid', enableCellEdit: true, cellTemplate: '<div class="ui-grid-cell-contents" >{{row.entity.matterClientId}}.{{row.entity.matterClient}}</div>', enableColumnMenu: false },
                    { field: 'matterModifiedDate', width: '15%', displayName: 'Modified Date', cellTemplate: '<div class="ui-grid-cell-contents"  datefilter date="{{row.entity.matterModifiedDate}}"></div>', enableColumnMenu: false },
                    { field: 'matterResponsibleAttorney', width: '15%', headerTooltip: 'Click to sort by attorney', displayName: 'Responsible attorney', cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.matterResponsibleAttorney}}</div>', enableColumnMenu: false },
                    { field: 'pin', width: '5%', cellTemplate: '<div class="ui-grid-cell-contents pad0" ><img ng-src="../Images/{{row.entity.pinType}}-666.png"  ng-click="grid.appScope.vm.pinorunpin($event, row.entity)"/></div>', enableColumnMenu: false },
                    { field: 'upload', width: '7%', cellTemplate: '<div class="ui-grid-cell-contents pad0"><img src="../Images/upload-666.png" ng-click="grid.appScope.vm.Openuploadmodal($event, row.entity)"/></div>', enableColumnMenu: false }
                ],
                onRegisterApi: function (gridApi) {
                    vm.gridApi = gridApi;
                    //Set the selected row of the grid to selectedRow property of the controller
                    gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                        vm.selectedRow = row.entity
                    });
                }
            }  
            //#endregion

            //#region API to get the client taxonomy and Practice Group taxonomy
            var optionsForClientGroup = {
                Client: {
                    Url: "https://msmatter.sharepoint.com/sites/microsoft"
                },
                TermStoreDetails: {
                    TermGroup: "MatterCenterTerms",
                    TermSetName: "Clients",
                    CustomPropertyName: "ClientURL"
                }
            };

            var optionsForPracticeGroup = {
                Client: {
                    Url: "https://msmatter.sharepoint.com/sites/microsoft"
                },
                TermStoreDetails: {
                    TermGroup: "MatterCenterTerms",
                    TermSetName: "Practice Groups",
                    CustomPropertyName: "ContentTypeName",
                    DocumentTemplatesName: "DocumentTemplates"
                }
            }

            function getTaxonomyDetailsForClient(optionsForClientGroup, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getTaxonomyDetails',
                    data: optionsForClientGroup,
                    success: callback
                });
            }

            function getTaxonomyDetailsForPractice(optionsForPracticeGroup, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getTaxonomyDetails',
                    data: optionsForPracticeGroup,
                    success: callback
                });
            }
            //#endregion

            //#region API to get matters for the selected criteria and bind data to grid
            //api for matter search
            function get(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'get',
                    data: options,
                    success: callback
                });
            }

            //api to get pinned matters
            function getPinnedMatters(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getPinnedMatters',
                    data: options,
                    success: callback
                });
            }

            //Callback function for pin 
            function pinMatter(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'PinMatter',
                    data: options,
                    success: callback
                });
            }


            //Callback function for unpin 
            function unpinMatter(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'UnpinMatter',
                    data: options,
                    success: callback
                });
            }

            function getFolderHierarchy(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getFolderHierarchy',
                    data: options,
                    success: callback
                });
            }


            vm.getMatterPinned = function () {                
                var pinnedMattersRequest = {
                    Url: "https://msmatter.sharepoint.com/sites/catalog"//ToDo: Read from config.js
                }
                getPinnedMatters(pinnedMattersRequest, function (response) {
                    vm.Pinnedobj = response;
                    vm.pinMatterCount = response.length;
                    vm.matterGridOptions.data = vm.Pinnedobj;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });  
            }

            vm.search = function () {
                $scope.lazyloader = false;
                var searchRequest = {
                    Client: {
                        Url: "https://msmatter.sharepoint.com/sites/catalog"
                    },
                    SearchObject: {
                        PageNumber: 1,
                        ItemsPerPage: 10,
                        SearchTerm: '',
                        Filters: {},
                        Sort: {
                            ByProperty: "LastModifiedTime",
                            Direction: 1
                        }
                    }
                };
                var pinnedMattersRequest = {
                    Url: "https://msmatter.sharepoint.com/sites/catalog"//ToDo: Read from config.js
                }
                var tempMatters = [];
                get(searchRequest, function (response) {
                    //We need to call pinned api to determine whether a matter is pinned or not                    
                    getPinnedMatters(pinnedMattersRequest, function (pinnedResponse) {
                        if (pinnedResponse && pinnedResponse.length > 0) {
                            vm.Pinnedobj = pinnedResponse;
                            vm.pinMatterCount = vm.Pinnedobj.length
                            angular.forEach(pinnedResponse, function (pinobj) {
                                angular.forEach(response, function (res) {
                                    //Check if the pinned matter name is equal to search matter name
                                    if (pinobj.matterName == res.matterName) {
                                        if (res.ismatterdone == undefined && !res.ismatterdone) {
                                            res.ismatterdone = true;
                                            res.pinType = "unpin"
                                        }                                        
                                    }                                    
                                });
                            });
                            vm.matterGridOptions.data = response;
                            vm.allMatterCount = response.length
                        }
                        else {
                            $scope.lazyloader = true;
                            vm.matterGridOptions.data = response;
                            vm.allMatterCount = response.length
                            vm.pinMatterCount = 0;
                        }
                    });                    
                    
                });
            }

            
            //This function will pin or unpin the matter based on the image button clicked
            vm.pinorunpin = function (e, currentRowData) {
                
                if (e.currentTarget.src.toLowerCase().indexOf("images/pin-666.png")>0 ) {
                    e.currentTarget.src = "../Images/loadingGreen.gif";
                    var pinRequest = {
                        Client: {
                            Url: "https://msmatter.sharepoint.com/sites/catalog"//ToDo: Need to read from config.js file
                        },
                        matterData: {
                            matterName: currentRowData.matterName,
                            matterDescription: currentRowData.matterDescription,
                            matterCreatedDate: currentRowData.matterCreatedDate,
                            matterUrl: currentRowData.matterUrl,
                            matterPracticeGroup: currentRowData.matterPracticeGroup,
                            matterAreaOfLaw: currentRowData.matterAreaOfLaw,
                            matterSubAreaOfLaw: currentRowData.matterSubAreaOfLaw,
                            matterClientUrl: currentRowData.matterClientUrl,
                            matterClient: currentRowData.matterClient,
                            matterClientId: currentRowData.matterClientId,
                            hideUpload: currentRowData.hideUpload,
                            matterID: currentRowData.matterID,
                            matterResponsibleAttorney: currentRowData.matterResponsibleAttorney,
                            matterModifiedDate: currentRowData.matterModifiedDate,
                            matterGuid: currentRowData.matterGuid,
                            pinType:'unpin'
                        }
                    }
                    pinMatter(pinRequest, function (response) {
                        if (response.isMatterPinned) {
                            e.currentTarget.src = "../images/unpin-666.png";
                            vm.pinMatterCount = parseInt(vm.pinMatterCount, 10) + 1;
                        }
                    });
                }
                else if (e.currentTarget.src.toLowerCase().indexOf("images/unpin-666.png") > 0) {
                    e.currentTarget.src = "../Images/loadingGreen.gif";
                    var unpinRequest = {
                        Client: {
                            Url: "https://msmatter.sharepoint.com/sites/catalog"//ToDo: Need to read from config.js file
                        },
                        matterData: {
                            matterName: currentRowData.matterUrl,
                        }
                    }
                    unpinMatter(unpinRequest, function (response) {
                        if (response.isMatterUnPinned) {
                            e.currentTarget.src = "../images/pin-666.png";
                            vm.pinMatterCount = parseInt(vm.pinMatterCount, 10) - 1;
                            vm.matterGridOptions.data.splice(vm.matterGridOptions.data.indexOf(currentRowData), 1)
                        }
                    });
                }
                
            }

           

            //#endregion

            //#region This event is going to file when the user clicks onm "Select All" and "UnSelect All" links
            vm.checkAll = function (checkAll, type,$event) {
            $event.stopPropagation();
                if (type === 'client') {
                    angular.forEach(vm.clients, function (client) {
                        client.Selected = checkAll;
                    });
                }
                if (type === 'pg') {
                    angular.forEach(vm.practiceGroups, function (pg) {
                        pg.Selected = checkAll;
                    });
                }
                if (type === 'aol') {
                    angular.forEach(vm.aolTerms, function (aol) {
                        aol.Selected = checkAll;
                    });
                }
            }

            //#region This event is going to fire when the user clicks on "OK" button in the filter panel
            vm.filterSearchOK = function (type) {
                if (type === 'client') {
                    vm.selectedClients = '';
                    angular.forEach(vm.clients, function (client) {
                        if (client.Selected) {
                            vm.selectedClients = vm.selectedClients + client.name + ","
                        }
                    });
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                }
                if (type === 'pg') {
                    vm.selectedPGs = '';
                    vm.selectedAOLs = '';
                    angular.forEach(vm.practiceGroups, function (pg) {
                        if (pg.Selected) {
                            vm.selectedPGs = vm.selectedPGs + pg.termName + ","
                            //For each of the selected pg's select corresponding aol check boxes automatically and update the aol
                            //textbox accordingly
                            angular.forEach(pg.areaTerms, function (areaterm) {
                                areaterm.Selected = true;
                                vm.selectedAOLs = vm.selectedAOLs + areaterm.termName + ","
                            });
                        }
                    });

                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                }

                if (type === 'aol') {
                    vm.selectedAOLs = '';
                    angular.forEach(vm.aolTerms, function (aol) {
                        if (aol.Selected) {
                            vm.selectedAOLs = vm.selectedAOLs + aol.termName + ","
                        }
                    });
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                }
            }
            //#endregion

            //#region This event is going to fire when the user clicks on "Cancel" button in the filter panel
            vm.filterSearchCancel = function (type) {
                vm.clientdrop = false;
                vm.clientdropvisible = false;
                vm.pgdrop = false;
                vm.pgdropvisible = false;
                vm.aoldrop = false;
                vm.aoldropvisible = false;
            }
            //#endregion

            //vm.getMatters();
            //vm.getPinnedMatters();
            //vm.getMyMatters();            
            //vm.getPracticeGroups()

            //#endregion 

            //#region Closing and Opening searchbar dropdowns
            vm.showupward = function ($event) {
                $event.stopPropagation();
                vm.searchdrop = true;
                vm.downwarddrop = false;
                vm.upwarddrop = true;
            }
            vm.showdownward = function ($event) {
                $event.stopPropagation();
                vm.searchdrop = false;
                vm.upwarddrop = false;
                vm.downwarddrop = true;
            }
            //#endregion

            //#region Showing and Hiding the sortby dropdown
            vm.showsortby = function ($event) {
                $event.stopPropagation();
                if (!vm.sortbydropvisible) {
                    vm.sortbydrop = true;
                    vm.sortbydropvisible = true;
                } else {
                    vm.sortbydrop = false;
                    vm.sortbydropvisible = false;
                }
            }
            //#endregion

            //#region Angular Datepicker Starts here
            //Start
            $scope.dateOptions = {
                formatYear: 'yy',
                maxDate: new Date()
            };
            $scope.enddateOptions = {
                formatYear: 'yy',
                maxDate: new Date()
            }
            $scope.$watch('startdate', function (newval, oldval) {
                $scope.enddateOptions.minDate = newval;
            });
            $scope.openStartDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                this.openedStartDate = true;
            };
            $scope.openEndDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                this.openedEndDate = true;
            };
            $scope.openedStartDate = false;
            $scope.openedEndDate = false;
            //#endregion

            //#region showing and hiding client dropdown
            vm.showClientDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.clientdropvisible) {
                    if (vm.clients === undefined) {
                        getTaxonomyDetailsForClient(optionsForClientGroup, function (response) {
                            vm.clients = response.clientTerms;
                        });
                    }
                    vm.clientdrop = true;
                    vm.clientdropvisible = true;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                } else {
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                }
            }
            //#endregion

            //#region showing and hiding practice group dropdown
            vm.showPracticegroupDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.pgdropvisible) {
                    if ((vm.practiceGroups === undefined) && (vm.aolTerms === undefined)) {
                        getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                            vm.practiceGroups = response.pgTerms;
                            vm.aolTerms = [];
                            angular.forEach(response.pgTerms, function (pgTerm) {
                                angular.forEach(pgTerm.areaTerms, function (areaterm) {
                                    vm.aolTerms.push(areaterm);
                                });
                            })
                        });
                    }
                    vm.pgdrop = true;
                    vm.pgdropvisible = true;
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                } else {
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                }
            }
            //#endregion

            //#region showing and hiding area of law dropdown
            vm.showAreaofLawDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.aoldropvisible) {
                    if ((vm.practiceGroups === undefined) && (vm.aolTerms === undefined)) {
                        getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                            vm.practiceGroups = response.pgTerms;
                            vm.aolTerms = [];
                            angular.forEach(response.pgTerms, function (pgTerm) {
                                angular.forEach(pgTerm.areaTerms, function (areaterm) {
                                    vm.aolTerms.push(areaterm);
                                });
                            })
                        });
                    }
                    vm.aoldrop = true;
                    vm.aoldropvisible = true;
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                } else {
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                }
            }
            //#endregion

            //#region File upload functionality
            vm.Openuploadmodal = function (event, currentRowData) {
                if (vm.selectedRow == undefined) {
                    vm.selectedRow = currentRowData
                }
                vm.getFolderHierarchy();
            }

            vm.getFolderHierarchy = function () {
                var matterData = {
                    MatterName: vm.selectedRow.matterName,
                    MatterUrl: "https://msmatter.sharepoint.com/sites/microsoft"
                };
                getFolderHierarchy(matterData, function (response) {
                    vm.foldersList = response.foldersList;
                    jQuery('#UploadMatterModal').modal("show");                    
                });
            }

            //This function will handle the files that has been dragged from the user desktop
            vm.handleDesktopDrop = function (targetDrop, sourceFiles) {
                vm.isLoadingFromDesktopStarted = true;
                vm.files = sourceFiles.files;
                var fd = new FormData();
                fd.append('targetDropUrl', targetDrop.url);
                fd.append('folderUrl', targetDrop.url)
                fd.append('documentLibraryName', vm.selectedRow.matterName)
                fd.append('clientUrl', 'https://msmatter.sharepoint.com/sites/microsoft');
                angular.forEach(vm.files, function (file) {
                    fd.append('file', file);
                })

                $http.post("/api/v1/document/uploadfiles", fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function (response) {
                    vm.isLoadingFromDesktopStarted = false;
                    console.log(response.data);
                    vm.uploadedFiles = response.data;
                }).catch(function (response) {
                    vm.isLoadingFromDesktopStarted = false;
                    console.error('Gists error', response.status, response.data);
                })

            }
            //#endregion

            //Call search api on page load
            $timeout(vm.search(), 500);

            //#region For Sorting by Alphebatical or Created date

            vm.sortyby = function (data) {
                vm.sortbytext = data;
            }

            //#endregion
        }
    ]);


    app.directive("toggletab", function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $(element).find('a').click(function (e) {
                    e.preventDefault()
                    $(this).tab('show')
                })
            }

        }
    });

})();