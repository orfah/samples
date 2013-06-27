
def prime?(i)
  m = Math.sqrt(i).round + 1
  ii = 2
  prime = true
  
  while prime and ii < m
    if i % ii == 0
      prime = false
      break
    end

    ii += 1
  end

  prime
end

def divisors(i)
  m = Math.sqrt(i).round
  ii = 2

  while ii < m
    if i % ii == 0
      a = ii
      b = i/ii

      puts "#{a} #{b}"

      puts "-- #{a} --" if prime?(a)
      puts "-- #{b} --" if prime?(b)
    end

    ii += 1
  end
end

p1 = 1
p2 = 1
pprime = p1 + p2

while true
#  puts "looking at #{pprime}"
  if pprime > 227000 and prime?(pprime)
    divisors(pprime + 1)
    exit
  end

  p1 = p2
  p2 = pprime
  pprime = p1 + p2
end
