task :default => 'components/oyITablets.xpt'

file 'components/oyITablets.xpt' => 'components/oyITablets.idl' do
  puts "Generating oyITablets.xpt. (requires flock dev environment)"
  `xpidl -m typelib -w -v -I $o/dist/idl -o components/oyITablets components/oyITablets.idl`
end
