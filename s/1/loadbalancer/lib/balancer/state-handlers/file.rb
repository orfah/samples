module Balancer

  class FileState < StateHandler
    def self.order
      100
    end

    def self.available?
      true
    end

    def write(path, obj)
      File.open(path, 'w') { |f| f << obj.to_json }
    end
    
    def read(path)
      File.exist?(path) ? JSON.parse(File.read(path)) : {}
    end

    def name
      @name.to_s.empty? ? 'lb_state' + rand(1..3000000) : @name
    end

    def last_check_path
      '/tmp/' + name + '-last-check'
    end

    def last_check=(time)
      time = time.to_i if time.is_a? Time      
      File.open(last_check_path, 'w') { |f| f << time }
    end

    def last_check
      File.exist?(last_check_path) ? 
        File.mtime(last_check_path) : Time.at(0)
    end

  end
end