ActionController::Routing::Routes.draw do |map|
  map.resources :users, :member => {:taboos => :any}
  map.root :controller => 'site', :action => 'index'
end
