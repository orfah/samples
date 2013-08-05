$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), "..", "lib"))

require "balancer"
require "rspec"

RSpec.configure do |config|
  config.order = :rand
end
