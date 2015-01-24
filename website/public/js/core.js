renebuyApp
.controller('MainCtrl', function($scope) {
	$scope.editMode = false;
	$('.navbar-collapse a').click(function(){
	    $(".navbar-collapse").collapse('hide');
	});
})
.filter('percentage', ['$filter', function ($filter) {
	return function (input, decimals) {
	    return $filter('number')(input * 100, decimals) + '%';
	};
}])
.run(function(editableOptions, editableThemes) {
  	editableThemes.bs3.inputClass = 'input-sm';
  	editableThemes.bs3.buttonsClass = 'btn-sm';
  	editableOptions.theme = 'bs3';
});