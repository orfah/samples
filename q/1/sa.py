#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
from pprint import pprint

trie = {}

"""
Insert a string into the trie.
"""
def traverse_string(string_id, string, trie):
  if string == '':
    return
  if not string[0] in trie:
    trie[string[0]] = { 'ids' : [] }

  trie[string[0]]['ids'].append(string_id)
  traverse_string(string_id, string[1:], trie[string[0]])

"""
Completely remove a string from the trie.
"""
def delete_from_trie(string_id, string, trie):
  if string == '' or not string[0] in trie:
    return
  i = trie[string[0]]['ids'].index(string_id)
  del trie[string[0]]['ids'][i]
  delete_from_trie(string_id, string[1:], trie[string[0]])

"""
Search the trie for a string. Returns an empty array if the
string is not a part of the trie; returns an array containing
all the string ids which match the string prefix.
"""
def search_trie(string, trie):
  if string == '':
    return []
  elif not string[0] in trie:
    return []
  elif len(string) == 1:
    return trie[string]['ids']

  return search_trie(string[1:], trie[string[0]])

def find_items(strings):
  global trie
  ids = []
  for string in strings:
    matched_ids = search_trie(string, trie)
    ids.append(matched_ids)

  intersect = set(ids[0])
  for string_id in ids:
    intersect = intersect.intersection( set(string_id) )

  items = []
  for object_id in intersect:
    obj = id_map[object_id]
    items.append([object_id, obj['score'], obj['type']])

  return items

def sort_by_weight(ids, weights):
  items_by_type = {}
  for item in ids:
    if not item[2] in items_by_type:
      items_by_type[item[2]] = []
    items_by_type[item[2]].append(item)

  for weight in weights:
    weight_bits = weight.split(':')
    weight_type = weight_bits[0]
    weight_score = float(weight_bits[1])

    items = items_by_type[weight_type]
    for item in items:
      item[1] = float(item[1]) * weight_score

  items = []
  for itype in items_by_type:
    for item in items_by_type[itype]:
      items.append(item)

  return sorted(items, key=lambda item: float(item[1]), reverse=True)


def sort_by_values(ids):
  return sorted(ids, key=lambda item: item[1], reverse=True)

def query(num_items, search_list):
  items = find_items(search_list)
  items = sort_by_values(items)
  return items[0:num_items]

def wquery(num_items, search_list, weights):
  num_items = int(num_items)
  items = find_items(search_list)
  items = sort_by_weight(items, weights)
  return items[0:num_items]

# sample data set
cmds = [
  '15',
  'ADD user u1 1.0 Adam D’Angelo',
  'ADD user u2 1.0 Adam Black',
  'ADD topic t1 0.8 Adam D’Angelo',
  'ADD question q1 0.5 What does Adam D’Angelo do at Quora?',
  'ADD question q2 0.5 How did Adam D’Angelo learn programming?',
  'QUERY 10 Adam',
  'QUERY 10 Adam D’A',
  'QUERY 10 Adam Cheever',
  'QUERY 10 LEARN how',
  'QUERY 1 lear H',
  'QUERY 0 lea',
  'WQUERY 10 0 Adam D’A',
  'WQUERY 2 1 topic:9.99 Adam D’A',
  'DEL u2',
  'QUERY 2 Adam'
]

num_cmds = int(cmds[0])
id_map = {}

i = 1
while i <= num_cmds:
  cmd_bits = cmds[i].split()
  cmd = cmd_bits[0]

  if cmd == 'ADD':
    data_type = cmd_bits[1]
    data_id = cmd_bits[2]
    data_score = cmd_bits[3]
    data = cmd_bits[4:]

    id_map[data_id] = {
      'type'  : data_type,
      'id'    : data_id,
      'score' : data_score,
      'data'  : data
    }

    for string in data:
      traverse_string(data_id, string.lower(), trie)
    
  elif cmd == 'QUERY':
    results = query(int(cmd_bits[1]), map(lambda s:s.lower(), cmd_bits[2:]))

  elif cmd == 'WQUERY':
    j = 0
    weights = []
    num_weights = int(cmd_bits[2])
    if num_weights > 0:
      while j < num_weights:
        weights.append(cmd_bits[j+3])
        j += 1
      start_pos = num_weights+3
      wquery(cmd_bits[1], map(lambda s:s.lower(), cmd_bits[start_pos:]), weights)
    else:
      wquery(cmd_bits[1], map(lambda s:s.lower(), cmd_bits[3:]), [])

  elif cmd == 'DEL':
    data_id = cmd_bits[1]
    obj = id_map[data_id]
    
    for string in obj['data']:
      delete_from_trie(data_id, string.lower(), trie)

  i += 1

