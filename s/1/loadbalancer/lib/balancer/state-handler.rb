module Balancer
  # duck typing for state: implement write and read
  class RedisState
    def initialize
      @redis = Redis.new
    end

    def write(key, obj)
      @redis.set(key, obj.to_json)
    end
    
    def read(key)
      obj = @redis.get(key) || '{}'
      JSON.parse(obj)
    end
    
  end

  class FileState
    def write(path, obj)
      File.open(path, 'w') { |f| f << obj.to_json }
    end
    
    def read(path)
      File.exist?(path) ? JSON.parse(File.read(path)) : {}
    end

  end
end
