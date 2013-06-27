require 'pp'
a = [3, 4, 9, 14, 15, 19, 28, 37, 47, 50, 54, 56, 59, 61, 70, 73, 78, 81, 92, 95, 97, 99]
l = a.length
c = 3
counter = 0

seen_arrays = {}

while c < l
  a.combination(c) do |p|
    p.sort!
    ap = p.pop
    if ap == p.reduce(:+)
      counter += 1
    end
  end
  c += 1
end
puts counter
