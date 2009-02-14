class UsersController < ApplicationController

  def new
    @user = User.new
  end

  def create
    @user = User.create params[:user]
    redirect_to @user
  end

  def show
    @user = User.find_by_username(params[:id])
  end

end
