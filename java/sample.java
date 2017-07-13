package com.company.product;

import static java.util.Arrays.asList;
import static java.util.Collections.synchronizedList;
import static org.apache.commons.collections.BagUtils.*; // We ignore wildcard static imports to simplify the code

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*; // We ignore wildcard static imports to simplify the code

import org.apache.commons.collections.Bag;
import org.apache.commons.collections.SortedBag;
import org.apache.commons.collections.bag.TreeBag;
import org.apache.commons.lang.StringUtils;

public class Demo {

  public static boolean method(String value) {
    if (StringUtils.isAllUpperCase(value)) {
      return true;
    } else if (true) {
      for (String sub : StringUtils.split(value)) { 
        List<String> fields = Arrays.asList(StringUtils.split(value + ""));
        Bag treeBag = unmodifiableBag(new TreeBag(fields));
        return treeBag.contains("comma");
      }
    }
    throw new IllegalArgumentException(value);
  }
  
  public static void main(String[] args) {
    List<String> list = new ArrayList<>();
    Set<String> set = new HashSet<String>();
    Set<? extends List<?>> concurrentSet = new CopyOnWriteArraySet<LinkedList<String>>();
    List<Integer> integers = asList(1, 2, 3);
    Set<Double> doubles = Collections.synchronizedSet(new HashSet<Double>());
    List<Float> floats = synchronizedList(new LinkedList<Float>());
    
    if (floats.size() > doubles.toArray(new Double[] {}).length) {
      float first = floats.get(0);
      System.out.println("Print " + first);
    }
    if (floats.isEmpty() || integers.size() < Integer.MAX_VALUE) {
      method("innerCall");
    }
    Iterator<String> it = list.iterator();
    while (it.hasNext()) {
      String v = it.next();
      Number d = (Number) Integer.valueOf(v);
    }
   }

}

