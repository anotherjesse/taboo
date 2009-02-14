require 'yaml'
require 'aws/s3'
require "active_support"

task :default => ['components/oyITaboo.xpt', :xpi]

file 'components/oyITaboo.xpt' => 'components/oyITaboo.idl' do
  puts "Generating oyITaboo.xpt. (requires flock dev environment)"
  `xpidl -m typelib -w -v -I $o/dist/idl -o components/oyITaboo components/oyITaboo.idl`
end


task :dev do
  `rm -rf /tmp/xpi-taboo`
  `mkdir -p /tmp/xpi-taboo`
  `cp -r . /tmp/xpi-taboo`

  update = "<em:updateURL>https://overstimulate.s3.amazonaws.com/update-taboo.rdf</em:updateURL>"

  build = "0.#{Time.now.to_i}"

  xml = open("/tmp/xpi-taboo/install.rdf", 'r').read
  f=open('/tmp/xpi-taboo/install.rdf', 'w')
  f.write(xml.gsub(/<em:version>.*<\/em:version>/, "<em:version>#{build}</em:version>\n    #{update}"))
  f.close

  `cd /tmp/xpi-taboo && sed -i 's/BUILD/#{build}/g' *.rdf`

  `cd /tmp/xpi-taboo && find chrome chrome.manifest components defaults install.rdf | egrep -v "(~|#|\.git|\.idl)" | xargs zip taboo.xpi`
  puts "Built version #{build}"
end

task :s3 => :dev do
  begin
    keys = YAML::load_file("s3.yml")['connection'].symbolize_keys
  rescue
    raise "Could not load AWS s3.yml"
  end

  AWS::S3::Base.establish_connection!(keys)

  [{:file => '/tmp/xpi-taboo/taboo.xpi', :content_type => 'application/x-xpinstall'},
   {:file => '/tmp/xpi-taboo/update-taboo.rdf', :content_type => 'text/xml'}].each do |f|
    AWS::S3::S3Object.store(File.basename(f[:file]), open(f[:file]), 'overstimulate', :access => "public-read", :content_type => f[:content_type])
  end

  puts "Uploaded to S3"
end


task :xpi do
  rm_f 'taboo.xpi'
  `find chrome chrome.manifest components defaults install.rdf -type f \
   | egrep -v "(#|~)" | egrep -v "\.idl$" | xargs zip taboo.xpi`
end
