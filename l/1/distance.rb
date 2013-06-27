#!/usr/local/bin/ruby
#

require 'optparse'
require 'pp'

# add a to_radians class to Fixnum and Float. Better solution? Leaves
# out Integer, BigNum, etc...
class Fixnum
  def to_radians
    self.to_f * (Math::PI/180)
  end
end

class Float
  def to_radians
    self * (Math::PI/180)
  end

  def mi_to_km
    self * 1.60934 
  end
end

module Distance
  # radius of the earth (miles), according to Google
  EARTH_RADIUS = 3959

  # simple tracker for starting point and ending point, no logic
  class Car
    attr_accessor :starting_pt, :ending_pt
    def initialize(starting_pt, ending_pt)
      @starting_pt = starting_pt
      @ending_pt   = ending_pt
    end
  end

  # latitude and longitude
  class Point
    attr_accessor :lat, :lng
    alias_method :latitude, :lat
    alias_method :longitude, :lng
    alias_method :lon, :lng

    def initialize(lat, lng)
      unless lat.respond_to?(:to_radians) and lng.respond_to?(:to_radians)
        raise ArgumentError, "Latitude and longitude must be floats"
      end

      @lat = lat.to_radians
      @lng = lng.to_radians
    end

    # haversine distance calculation, as found on:
    # http://andrew.hedges.name/experiments/haversine/
    def distance_to(pt)
      puts "calculating distance from #{@lat},#{@lng} to #{pt.lat},#{pt.lng}"
      dlat = pt.lat - @lat
      dlng = pt.lng - @lng

      a = (Math.sin(dlat/2))**2 + Math.cos(@lat) * Math.cos(pt.lat) * (Math.sin(dlng/2))**2
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      d = Distance::EARTH_RADIUS * c
      puts d
      d
    end

  end

  def self.options
    opts = {}
    # because I've never used a Proc before
    car_input = Proc.new { |pos| pos.split(',').collect { |p| p.to_f } }

    opt_parser = OptionParser.new do |opt|
      opt.banner = "Usage: distance [OPTIONS]"
      opt.separator ""
      opt.separator "Options"

      # required
      opt.on("--car1 LOCATION", "input") do |pos|
        opts[:car1] = car_input.call(pos)
      end
      opt.on("--car2 LOCATION", "input") do |pos|
        opts[:car2] = car_input.call(pos)
      end

      opt.on("-i", "--interactive", "interactive mode") do
        opts[:interactive] = true
      end

      opt.on("-km", "--kilometers", "display distance in kilometers") do 
        opts[:units] = :km
      end
      opt.on("-mi", "--miles", "display distance in miles (default)") do
        opts[:units] = :mi
      end

      opt.on("-v", "--verbose", "be verbose") do
        opts[:verbose] = true
      end
      opt.on("-h", "--help", "print usage info") do
        puts opt_parser
      end
    end

    opt_parser.parse!
    opts
  end

  def self.be_verbose(c1_label, c2_label, distances)
    puts "calculating route for #{c1_label}..."
    puts "  starting at #{c1_label} starting point..."
    puts "  distance to #{c2_label} starting point: #{distances[0]} ..."
    puts "  distance to #{c2_label} ending point: #{distances[1]} ..."
    puts "  distance to #{c1_label} ending point: #{distances[2]} ..."
    puts "  Total distance: #{distances.reduce(:+)}"
    puts
  end

  def self.find_shortest(car1, car2, verbose=false)
    car1_distance = [car1.starting_pt.distance_to(car2.starting_pt)]
    car1_distance << car2.starting_pt.distance_to(car2.ending_pt)
    car1_distance << car2.ending_pt.distance_to(car1.ending_pt)
    be_verbose('car1', 'car2', car1_distance) if verbose

    car2_distance = [car2.starting_pt.distance_to(car1.starting_pt)]
    car2_distance << car1.starting_pt.distance_to(car1.ending_pt)
    car2_distance << car1.ending_pt.distance_to(car2.ending_pt)
    be_verbose('car2', 'car1', car2_distance) if verbose

    car1_distance = car1_distance.reduce(:+)
    car2_distance = car2_distance.reduce(:+)
    car1_distance < car2_distance ? car1_distance : car2_distance
  end

  def self.run(args)
    o = options
    if o[:verbose]
      puts "Read-in options:"
      o.each_pair { |k, v| puts "   #{k} => #{v}" }
      puts
    end

    if o[:interactive]
      cars = [:car1, :car2]
      positions = [:starting, :ending]

      puts "Starting interactive mode..."
      cars.each do |c|
        positions.each do |p|
          o[c] ||= []
          puts "Please enter #{c} #{p} position: "
          o[c] += gets.chomp.gsub(/,/, ' ').split
        end
        puts
      end
    else
      unless o[:car1] and o[:car2] and
             o[:car1].length == 4  and
             o[:car2].length == 4  and
             o[:car1].all? { |p| p.respond_to?(:to_radians) } and
             o[:car2].all? { |p| p.respond_to?(:to_radians) } 
        raise OptionParser::ParseError, "Car starting positions must be provided as floats"
      end
    end

    o[:car1].collect! { |p| p.to_f }
    o[:car2].collect! { |p| p.to_f }

    pp o[:car1]
    pp o[:car2]

    c1_start = Point.new(o[:car1][0], o[:car1][1])
    c1_end   = Point.new(o[:car1][2], o[:car1][3])
    c1 = Car.new(c1_start, c1_end)

    c2_start = Point.new(o[:car2][0], o[:car2][1])
    c2_end   = Point.new(o[:car2][2], o[:car2][3])
    c2 = Car.new(c2_start, c2_end)

    shortest_distance = find_shortest(c1, c2, o[:verbose])
    if o[:units] == :km
      puts "Converting to km..." if o[:verbose]
      shortest_distance = shortest_distance.mi_to_km
    end

    puts "Shortest Distance: #{shortest_distance} #{o[:units]||'mi'}"
  end

end

Distance.run(ARGV)
