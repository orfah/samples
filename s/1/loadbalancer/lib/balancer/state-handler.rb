#
# StateHandler is intended to be a base class from which all
# modular state writers will inherit.  StateHandler implements
# an inherited hook so that additional handlers may be added
# in a drop-in manner, with no code changes to the load balancer.
#
# A state handler is expected to implement the following api:
# .order
#   the order in which state handlers will be evaluated.  Lower
#   numbers are evaluated first; the first handler to be available?
#   will be instantiated and returned
#
# .available?
#   returns a boolean signifying the system supports this state handler
#
# .write(key, state)
#   writes the state out, given a +key+ and the +state+.  Expected to be
#   able to retrieve the state using read(key)
#
# .read(key)
#   retrieves the state written under +key+.  If no key is found, returns {}
#
# .last_check=(time)
#   Logs the Time at which the state of the world was recorded.
#
# .last_check
#    Retrieves the last Time at which the state of the world was recorded.
#
module Balancer
  $HANDLERS = []

  class StateHandler
    attr_accessor :name

    def self.inherited(subclass)
      $HANDLERS << subclass
      $HANDLERS.sort { |a, b| a.order <=> b.order }
    end

    # do not include this stub class
    def self.available?
      false
    end

    def self.order
      200
    end
  end
end
