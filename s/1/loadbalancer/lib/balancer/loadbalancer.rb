#
# LoadBalancer class.
#
# Sits in front of any number of hosts, each of which must be
# configured with an address and healthcheck_target.
#
# LoadBalancer may be configured to return the next host as:
#  - Round-Robin (default)
#  - Load Feedback
#  - Random
#  - Asymetric Load
#
# A check of all host target files will be performed every +ttl+
# seconds, by default 300s.  This check may also be triggered
# manually, and will reset the ttl timer.  
#
# After checking hosts, the state of the world as seen by the balancer 
# will be written to /tmp for inspection.  State change notification
# for each host can be included by setting the alert_hook attribute.
#
# Hosts may be dynamically added or removed by calling add_host
# and remove_host, respectively.
#
# EX:
# lb = Balancer::LoadBalancer.new('my-balancer-cname')
# lb.hosts = [host1, host2, host3]
# next_host = lb.host
# next_next_host = lb.host
#
# lb.add_host host4
# lb.remove_host host1
#
# lb.state  # [ host2.to_s, host3.to_s, host4.to_s ]
#
module Balancer
  class LoadBalancer
    attr_accessor :cname
    attr_accessor :mode
    attr_accessor :ttl
    attr_accessor :persistent
    attr_accessor :alert_hook
    attr_reader :last_check_time

    ROUND_ROBIN_MODE = 'round-robin'
    LFB_MODE = 'lfb'
    RANDOM_MODE = 'random'
    ASYM_MODE = 'asym'

    def initialize(*args, &block)
      if args.flatten.first.respond_to?(:each_pair)
        init_with_hash(args.flatten.first)
      else
        cname = args.flatten[0].to_s
      end 

      if block_given?
        instance_eval(&block)
      end

      @state_handler = defined?(Redis) ? RedisState.new : FileState.new
    end

    def init_with_hash(hash)
      hash.each_pair do |arg, value|
        arg = arg.downcase.to_sym

        send(arg, val) if self.respond_to?(arg)
      end
    end 

    def config(config_path)
      raise "Config file does not exist! #{config_path}" unless File.exist? config_path
      c = YAML.load(config_path)
      hosts = c.delete('hosts') || []

      init_with_hash(c)

      hosts.each do |h|
        hh = Host.new(h)
        add_host(hh)
      end
    end

    # return the next host to route traffic to
    def host(client=nil)
      raise "No configured hosts!" if @hosts.length == 0
      # check host state if ttl is expired
      state

      case mode
      when ROUND_ROBIN_MODE
        # hosts array is a computed attribute, so keep track of an index instead
        @_host_index ||= 0
        @_host_index %= hosts.length
        h = hosts[@_host_index]
        @_host_index += 1
      when LFB_MODE
        h = hosts.sort { |a, b| (b.load_target - b.load) <=> (a.load_target - a.load) }.first
      when RANDOM_MODE
        h = hosts.sample
      when ASYM_MODE
        total = hosts.reduce(0) { |sum, host| sum + host.asym_target }

        loop_count = 0
        until h
          h = hosts.detect { |host| r = Kernel.rand(total) < host.asym_target }
          # simple bailout if we looped and the rng bites us
          h = hosts.first if loop_count > 10
          loop_count += 1
        end
      end
      
      if persistent and client
        h = persist(client, h) 
      end
  
      h
    end
  
    def hosts(include_down=false)
      selected_hosts = include_down ? @hosts : @hosts.select { |h| h.up? }
      # all down == all up
      selected_hosts = @hosts if selected_hosts.empty?
      selected_hosts
    end

    # more error checking here?
    def hosts=(val)
      @hosts = val
    end
    
    #
    # Performs a polling of all hosts behind this load balancer.
    #
    def check
      @last_check_time = Time.now
      hydra = Typhoeus::Hydra.new
      @hosts.each do |h|
        hydra.queue h.healthcheck_request
      end
      hydra.run

      alert_state_change
      log_state
    end

    def log_state
      state = {}
      @hosts.each do |h|
        state[h.id] = h.state
      end

      write_state(state)
      state
    end

    def alert_state_change
      unless @alert_hook.nil?
        @hosts.each do |h|
          if state[h.id] and state[h.id] != h.state
            @alert_hook.call(h)
          end
        end
      end
      true
    end
  
    # Print out the state of the hosts behind this load balancer.
    # Kicks off a check if the ttl has expired.
    def state
      ttl_expired? ? check : @state_handler.read(state_path)
    end

    def ttl_expired?
      @last_check_time.nil? or @last_check_time < (Time.now - ttl)
    end
  
    def mode
      @mode || ROUND_ROBIN_MODE
    end
  
    def mode=(val)
      # guarantee mode is valid
      unless [ROUND_ROBIN_MODE, LFB_MODE, RANDOM_MODE, ASYM_MODE].include? val
        val = ROUND_ROBIN_MODE
      end
      @mode = val
    end
  
    def persistent
      @persistent || false 
    end

    def persistent=(val)
      @persistent = val
    end
  
    # default 5m ttl
    def ttl
      @ttl || 300
    end

    def ttl=(val)
      val = 300 if val < 5
      @ttl = val
    end
  
    def add_host(host)
      @hosts << host 
    end

    def remove_host(host)
      @hosts.reject! { |h| h.hash == host.hash }
    end

    def write_state(state)
      @state_handler.write(state_path, state)
      if persistent and @persist_map
        @state_handler.write(persist_map_path, @persist_map)
      end
    end

    def state_path
      "/tmp/#{cname}-balancer-state.json"
    end

    def persist_map_path
      "/tmp/#{cname}-persist-map.json"
    end

    def persist(client, assigned_host, force=false)
      @persist_map ||= @state_handler.read(persist_map_path)
      mapped_host = find_host(@persist_map[client])
      if force or mapped_host.nil? or mapped_host.down?
        @persist_map[client] = assigned_host.hash
        mapped_host = assigned_host
      end

      mapped_host
    end

    # assign host to client even if a previous match exists
    def persist!(client, assigned_host)
      persist(client, assigned_host, true)
    end

    def find_host(host_hash)
      @hosts.find { |h| h.hash == host_hash }
    end
  end
end
