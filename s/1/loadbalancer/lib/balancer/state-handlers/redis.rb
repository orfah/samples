module Balancer
  class RedisState < StateHandler
    def initialize
      @redis = Redis.new
    end

    def self.order
      50
    end

    def self.available?
      defined?(Redis)
    end

    def write(key, obj)
      @redis.set(key, obj.to_json)
    end
    
    def read(key)
      obj = @redis.get(key) || '{}'
      JSON.parse(obj)
    end

    def last_check=(time)
      time = time.to_i if time.is_a? Time
      @redis.set(name + '-last-check', time)
    end

    def last_check
      Time.at(@redis.get(name + '-last-check').to_i) || Time.at(0)
    end
    
  end
end