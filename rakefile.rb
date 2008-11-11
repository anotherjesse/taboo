task :default => ['components/oyITaboo.xpt', :xpi]

file 'components/oyITaboo.xpt' => 'components/oyITaboo.idl' do
  puts "Generating oyITaboo.xpt. (requires flock dev environment)"
  `xpidl -m typelib -w -v -I $o/dist/idl -o components/oyITaboo components/oyITaboo.idl`
end


task :xpi do
  rm_f 'taboo.xpi'
  `find chrome chrome.manifest components defaults install.rdf -type f \
   | egrep -v "(#|~)" | egrep -v "\.idl$" | xargs zip taboo.xpi`
end 
