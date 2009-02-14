class CreateTaboos < ActiveRecord::Migration
  def self.up
    create_table :taboos do |t|
      t.integer :user_id
      t.string :url
      t.string :title
      t.string :description
      t.text :favicon
      t.timestamp :deleted_at
      t.text :blob

      t.timestamps
    end
  end

  def self.down
    drop_table :taboos
  end
end
