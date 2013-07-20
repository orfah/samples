module Balancer
  require 'digest/sha2'
  require 'typhoeus'
  require 'date'
  require 'json'

  if defined?(Redis)
    require 'redis'
  end

  require 'balancer/loadbalancer'
  require 'balancer/host'
  require 'balancer/state-handler'
end
