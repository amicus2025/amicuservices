// Map integration removed — stub to avoid errors if referenced elsewhere.
window.initMap = function(){
  console.warn('initMap: map feature removed');
  return { focus: function(){}, fitAll: function(){} };
};
