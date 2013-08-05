#
# Balancer::Host
#
# A host that sits behind a Balancer::LoadBalancer.
#
# Each host is represents a specific server, with at minimum
# a valid URI and healthcheck_target.  Additional options
# may be specified in order to accomodate common curl
# parameters such as host_headers or username/password
# combinations.
#
# A host tracks it's previous 20 healthcheck responses to 
# determine if it is flapping.  The healthcheck results
# are weighted by recency.
#
# Hosts may be initialized by block, hash, or string.
# EX:
# host = Balancer::Host.new(address: "localhost", healthcheck_target: "target")
#
# host = Balancer::Host.new do
#   address "localhost"
#   healthcheck_target "target"
# end
#
# host = Balancer::Host.new("http://localhost/target")
#
module Balancer
  class Host
    # for determining flapping state
    FLAPPING_THRESHOLD = 0.3

    # the hostname or ip address. This string may contain other optional
    # fields, such as port or username, in a valid URI string.
    # EX: user:pass@192.168.10.32/healthcheck
    attr_accessor :address

    # the port to access the healthcheck on
    attr_accessor :port

    # a username for validating the healthcheck, if required
    attr_accessor :username

    # a password for validating the healthcheck, if required
    attr_accessor :password

    # an optional host header for accessing the host, if required
    attr_accessor :host_header

    # the target load feedback number
    attr_accessor :load_target

    # the target asymetrical load number.
    attr_accessor :asym_target

    # the file representing the healthcheck to pull.  This may also
    # be included in the address as a catch-all
    attr_accessor :healthcheck_target
    alias_method :target, :healthcheck_target
    alias_method :target=, :healthcheck_target=

    # time when last healthcheck occurred
    attr_reader :last_healthcheck

    # the last Typhoeus response object, from healthcheck
    attr_reader :last_response

    def initialize(*args, &block)
      @state_history = 0xfffff

      if args.flatten.first.respond_to?(:each_pair)
        init_with_hash(args.flatten.first)
      else
        init_with_string(args.flatten[0].to_s)
      end 

      if block_given?
        instance_eval(&block)
      end
    end

    def init_with_hash(hash)
      hash.each_pair do |arg, value|
        arg = arg.downcase.to_sym

        send(arg, val) if self.respond_to?(arg)
      end
    end 

    def init_with_string(string)
      # connection string
      string.split(';').each do |args|
        arg, value = args.split('=')
        arg = (arg + '=').downcase.to_sym

        send(arg, value) if self.respond_to?(arg)
      end

      # allow for just url, no identifiers
      unless address
        self.parse_url string
      end

      raise "Invalid host string" unless address and healthcheck_target
    end

    def id
      address + '/' + target
    end

    # assume response body is a simple number.  
    # Fires off healthcheck if necessary.
    def load
      unless @last_response
        healthcheck
      end
      @last_response.body.to_i
    end

    # str expected in format:
    # (http://)?hostname.com/healthcheck_target
    def parse_url(str)
      str.gsub!(/^\s*http:\/\//, '')
      components = str.split('/')
      self.address = components[0]
      self.healthcheck_target = components[1..-1].join('/')
    end

    def healthcheck_location
      healthcheck_target ? address + '/' + healthcheck_target : address
    end

    #
    # Performs an immediate healthcheck on the host. By default,
    # returns a simple boolean indicating if the healthcheck was
    # a success or failure. Pass in options hash to return the full
    # Typhoeus response object.
    #
    def healthcheck(options={})
      r = healthcheck_request
      # immediate blocking call
      r.run
      options[:full_response] ? @last_response : @last_response.success?
    end

    #
    # Returns a request handle ready for curl_multi use.
    #
    def healthcheck_request
      request = Typhoeus::Request.new(healthcheck_location, healthcheck_options)
      request.on_complete { |r| healthcheck_callback(r) }
      request
    end

    def healthcheck_callback(r)
      @last_response = r
      @state = r.success? ? r.body : false
      @last_healthcheck = Time.now

      # record state history, up to 20 previous entries
      @state_history = @state_history << 1 | (@state ? 1 : 0) & 0xfffff
    end

    # sets Typhoeus request options
    def healthcheck_options
      options = {}
      options[:userpwd] = username + ':' + password if username
      options[:port] = port.to_i if port
      options[:headers] = { Host: host_header } if host_header
      options[:followlocation] = true

      options
    end

    def overloaded?
      unless load_target.nil?
        return load_target < self.load
      end
      false
    end

    def state
      if flapping?
        'flapping'
      elsif up?
        'up'
      else
        'down'
      end
    end

    def up?
      # cast @state into boolean
      healthcheck if @state.nil?
      @state and not flapping?
    end

    # convenience method
    def down?
      not up?
    end

    def flapping?
      flapping_score > FLAPPING_THRESHOLD
    end

    def flapping_score
      # similar to nagios style detection: weight more recent state change more
      # http://nagios.sourceforge.net/docs/3_0/flapping.html
      count = 0
      weight = 1.2
      0.upto(18) do |bit|
        count += @state_history[bit] == @state_history[bit+1] ? 0 : weight
        weight -= 0.02
      end

      count/20.0
    end

    def hash
      # must be a more elegant way of generating this string...
      option_str = self.port.to_s + self.username.to_s + self.password.to_s +
        self.host_header.to_s + self.load_target.to_s + self.asym_target.to_s +
        self.healthcheck_target.to_s
      Digest::MD5.hexdigest("#{self.class.name}#{address}#{option_str}").to_i(16)
    end

    def to_s
      "address: #{address} " +
      "target: #{healthcheck_target}" +
      "state: #{state}"
    end

  end
end
