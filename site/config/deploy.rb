require 'capistrano_colors' rescue nil

set :application, "taboo"

set :deploy_to, "/home/deploy/taboo"
set :deploy_via, :remote_cache
set :branch, 'sync2'
set :repository, "git@github.com:anotherjesse/taboo.git"
set :scm, :git
set :git_shallow_clone, 1

set :user, 'deploy'
set :use_sudo, false

role :app, 'taboo.overstimulate.com'
role :web, 'taboo.overstimulate.com'
role :db,  'taboo.overstimulate.com', :primary => true

set :rails_env, 'production'

ssh_options[:paranoid] = false

desc "copy config files in after deploy"
task :after_update_code do
  run "cp #{shared_path}/config/*.yml #{release_path}/site/config/"
end

namespace :deploy do
  task :restart, :roles => :app do
    run "touch #{current_path}/site/tmp/restart.txt"
  end
end
