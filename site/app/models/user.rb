class User < ActiveRecord::Base
  has_many :taboos
  def to_param
    username
  end
end
