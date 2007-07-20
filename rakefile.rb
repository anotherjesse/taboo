task :default => 'components/oyITaboo.xpt'

file 'components/oyITaboo.xpt' => 'components/oyITaboo.idl' do
  puts "Generating oyITaboo.xpt. (requires flock dev environment)"
  `xpidl -m typelib -w -v -I $o/dist/idl -o components/oyITaboo components/oyITaboo.idl`
end


task :xpi do
  rm_f 'taboo.xpi'
  `find chrome components install.rdf defaults | xargs zip taboo.xpi`
end 
