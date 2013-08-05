$LOAD_PATH.unshift(File.dirname(__FILE__))
module Balancer
  require 'digest/sha2'
  require 'typhoeus'
  require 'date'
  require 'json'
  require 'yaml'

  begin
    require 'redis'
  rescue
    # no redis :(
  end

  require 'balancer/loadbalancer'
  require 'balancer/host'
  require 'balancer/state-handler'

  # include any defined state handlers
  Dir[File.dirname(__FILE__) + '/balancer/state-handlers/*.rb'].each do |file|
    require file
  end
end
