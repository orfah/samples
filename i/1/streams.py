import random
from threading import Thread, Lock

from pprint import pprint

"""
Randoms
"""
class Randoms:
  def __init__(self):
    self.seen = set()

  def popNext(self, loopCount=0):
    num = random.randint(1, 10000000)

    # Just in case
    if loopCount > 1000:
      return None

    if num in self.seen:
      return self.popNext(loopCount + 1)
    else:
      self.seen.add(num)
      return num

  # this would be the same for all the lazy streams, so I only
  # include it on Randoms
  def popN(self, num):
    nums = []
    for i in range(1, num):
      nums.append(self.popNext())
    return nums

  def threadedPopN(self, num):
    self.lock = Lock()
    self.popped = []

    # this could be generalized to support an arbitrary number of threads
    numThreads = 2
    threads = []

    for i in range(0, numThreads):
      threads.append(Thread(target=self.threadedPopNHelper(int(num/numThreads))))

    for t in threads:
      t.start()

    for t in threads:
      t.join()

    return self.popped

  def threadedPopNHelper(self, num):
    for i in range(0, num):
      self.lock.acquire()
      self.popped.append(self.popNext())
      self.lock.release()

"""
Primes
"""
class Primes:
  def __init__(self):
    self.lastPrime = 0

  def isPrime(self, n):
    if n == 2:
      return True

    # no evens
    if not n & 1:
      return False

    for i in range(3, int(n**0.5)+1, 2):
      if n % i == 0:
        return False
    return True

  def popNext(self):
    if self.lastPrime == 0:
      nextPrime = 2
    elif self.lastPrime == 2:
      nextPrime = 3
    else:
      nextPrime = self.lastPrime + 2

      while not self.isPrime(nextPrime):
        nextPrime += 2

    self.lastPrime = nextPrime
    return nextPrime

  # same as non threaded, but with a lock when we set lastPrime
  def threadedPopNext(self):
    if self.lastPrime == 0:
      nextPrime = 2
    elif self.lastPrime == 2:
      nextPrime = 3
    else:
      nextPrime = self.lastPrime + 2

      while not self.isPrime(nextPrime):
        nextPrime += 2

    self.lock.acquire()
    self.lastPrime = nextPrime
    self.lock.release()

    return nextPrime

  def threadedPopN(self, num):
    self.lock = Lock()
    self.popped = []

    numThreads = 2
    threads = []

    for i in range(0, numThreads):
      threads.append(Thread(target=self.threadedPopNHelper(int(num/numThreads))))

    for t in threads:
      t.start()

    for t in threads:
      t.join()

    return self.popped

  def threadedPopNHelper(self, num):
    for i in range(0, num):
      n = self.threadedPopNext()
      self.lock.acquire()
      self.popped.append(n)
      self.lock.release()      

  # windowed, threaded approach
  def windowedPopNext(self, startAt, endAt):
    if startAt == 0:
      nextPrime = 2
    elif startAt == 2:
      nextPrime = 3
    else:
      if startAt % 2 == 1:
        startAt += 1

      nextPrime = startAt + 2

      while not self.isPrime(nextPrime):
        nextPrime += 2
        if nextPrime < endAt:
          return None

    return nextPrime

  def windowedPopNHelper(self, startAt, endAt):
    running = True
    while running:
      n = self.threadedPopNext()
      if n == None:
        running = False
      else:
        self.lock.acquire()
        self.popped.append(n)
        self.lock.release()  
"""
PrimeFactors
"""
class PrimeFactors:
  def __init__(self, n):
    self.lastFactor = 0
    self.numerator = n

  def popNext(self):
    if self.lastFactor == 0:
      nextFactor = 2
    else:
      nextFactor = self.lastFactor

    while self.numerator > 1:
      if self.numerator % nextFactor == 0:
        self.numerator = int(self.numerator/nextFactor)

        if nextFactor == self.lastFactor:
          continue

        self.lastFactor = nextFactor
        return nextFactor
      nextFactor += 1

    # no more factors
    return None

  def threadedPopNext(self):
    if self.lastFactor == 0:
      nextFactor = 2
    else:
      nextFactor = self.lastFactor

    while self.numerator > 1:
      if self.numerator % nextFactor == 0:
        self.lock.acquire()
        self.numerator = int(self.numerator/nextFactor)
        self.lock.release()

        if nextFactor == self.lastFactor:
          continue

        # it's probably wrong to have two locks in such close proximity
        self.lock.acquire()
        self.lastFactor = nextFactor
        self.lock.release()
        return nextFactor
      nextFactor += 1

    # no more factors
    return None

"""
Higher-order functions
"""
def map(fn, stream):
  return LazyStreamable(lambda: fn(stream.popNext()))

def filter(fn, stream):
  def innerFilterFn():
    for val in iter(stream.popNext, None):
      if fn(val):
        return val

  return LazyStreamable(innerFilterFn)

def zipWith(fn, streamA, streamB):
  return LazyStreamable(lambda: fn(streamA.popNext(), streamB.popNext()))

def prefixReduce(fn, stream, init):
  return LazyMemoizer(fn, stream, init)

"""
Stream-like objects
"""
class LazyStreamable:
  def __init__(self, fn):
    self.fn = fn

  def popNext(self):
    return self.fn()

class LazyMemoizer:
  def __init__(self, fn, stream, init):
    self.fn = fn
    self.stream = stream
    self.val = init

  def popNext(self):
    self.val = self.fn(self.val, self.stream.popNext())
    return self.val

"""
Discussion:

I'm not a threading master, I never took that particular class in college,
so these answers are essentially my very limited previous experiences with
threads and a single night reading up on python threads.

Threading at the stream level seems like it would vary depending on which
lazy class is performing popN.  Randoms seems like we would have the best
success, since it's not ordered, although it does have the "unique" limitation,
so we will need to share a little state, or else deal with the edge case that
we have repeated numbers.

Primes states it returns ordered prime numbers, so threading would not seem to
buy us any performance increase.  We can guess where we think the nth prime will
be found (e.g. thread 1 searches for primes between 0 and 1 million, thread 2
searches between 1 million and 2 million, and so on) and try to window the 
numbers each thread will search, but this added complexity seems like it has
diminishing returns, especially considering the GIL.

If, however, we apply threading to some of the higher-order functions, we could
potentially benefit more, particularly if the function being applied is an expensive
one.  A Producer/Consumer type model seems to fit: one thread to fill a shared
queue, and one thread to apply the transformative function.

All of this comes with the caveat that python implements a Global Interpreter 
Lock (GIL).  Unless the processing function will perform work that will sidestep
the GIL, we will likely see little benefit and perhaps even some slowdown due
to the overhead of creating the threads.
Disclaimer: I'm reading about this at 3am with no real background in python, 
so....yeah, grain of salt and all that.

Please forgive any transgressions I may have made against the python language.
Sincere apologies for how I may have mangled it.
"""

"""
Some basic test cases I ran
"""
# r = Randoms()
# for i in range(0, 100):
#   print r.popNext()

# p = Primes()
# for i in range(0, 100):
#   print p.popNext() 

# pf = PrimeFactors(11741730)
# for i in range(0, 100):
#   print pf.popNext()

# square = lambda x: x ** 2
# lessthan = lambda x: x < 10 
# concat = lambda x, y: str(x) + '-' + str(y)
# additive = lambda x, y: x + y
# 
# for i in range(0, 1000):
#   p = Primes()
#   pprint(p.threadedPopN(20))

# stream = map(square, r)
# stream = filter(lessthan, pf)
# stream = zipWith(concat, r, p)
# stream = prefixReduce(additive, p, 0)

#for i in range(0, 10):
#  print stream.popNext()