function pythonParser(r, emit) {

  //////////////
  // Constants 
  //////////////

  const builtInFuncs = [
    "abs", "all", "divmod", "input", "int", "open", "ord", "staticmethod", "enumerate",
    "str", "any", "eval", "isinstance", "pow", "sum", "basestring", "execfile", "issubclass",
    "print", "super", "bin", "file", "iter", "property", "tuple", "bool", "filter", "len",
    "range", "type", "bytearray", "float", "list", "raw_input", "unichr", "callable", "format",
    "locals", "reduce", "unicode", "chr", "frozenset", "long", "reload", "vars", "classmethod",
    "getattr", "map", "repr", "xrange", "cmp", "globals", "max", "reversed", "zip", "compile",
    "hasattr", "memoryview", "round", "__import__", "complex", "hash", "min", "set", "delattr",
    "help", "next", "setattr", "dict", "hex", "object", "slice", "dir", "id", "oct", "sorted"
  ];

  ////////////////////////
  // Collector variables
  ////////////////////////

  let modules   = new Map(); // "md5"                => "hashlib.md5" 
  let variables = new Map(); // "m"                  => "md5"  
  let members   = new Map(); // "hashlib.md5.digest" => { "module": "hashlib.md5", "member": "digest", "count": 2 }


  ////////////////////////
  // Collector functions
  //////////////////////// 

  let continueProcessing = true;

  /* Register a new module */
  let addModule = function(moduleName, shortName) {
    if (moduleName.includes('..') || moduleName.includes('./')) { // Ex: from .. import truc
      return; // Ignore module defined by relative path
    }

    if (!shortName) {
      let i = moduleName.lastIndexOf(".");
      if (i === -1) {
        shortName = moduleName;
      } else {
        shortName = moduleName.substring(i + 1);
      }
    }

    modules.set(shortName, moduleName);
    //console.log("New module " + moduleName + " as " + shortName);
  };


  /* Register a new variable */
  let addVariable = function(type, variable) {

    let moduleName = type;
    let member = null;
    if (type.includes('.')) {
      moduleName = type.substring(0, type.indexOf('.'));
      member = type.substring(type.indexOf('.') + 1);
    }

    if (!modules.has(moduleName)) {
      return;
    }

    let module = modules.get(moduleName);
    let fullName = module;
    if (member) {
      fullName += "." + member;
    }

    variables.set(variable, fullName);
    //console.log("New variable " + variable + " of type " + fullName);
  };


  /* Register a new member */
  let addMember = function(member) {
     let parts = member.split('.');
     let callee = parts[0];
     let func = parts.slice(1).join('.');

     let fullModule = null;

     if (variables.has(callee)) {
       fullModule = variables.get(callee);
     } else if (modules.has(callee)) {
       fullModule = modules.get(callee);
     } else if (builtInFuncs.indexOf(callee) !== -1) {
       fullModule = callee; 
     } else {
       //console.log("Failed to find " + member + "...");
       return;
     }

     let fullName = fullModule;
     if (func) {
       fullName += "." + func;
     }

     if (members.has(fullName)) {
       members.get(fullName)['count'] += 1;
     } else {
       members.set(fullName, { "module": fullModule, "member": func, "count": 1 });
     }
     //console.log("New member " + fullName);
  };


  ////////////////////
  // Process content
  ////////////////////

  if (!r.content) {
    return;
  }
  
  let lines = r.content.split("\n");
  let lineNumber = -1;
  while (lineNumber + 1 < lines.length) {
    let line = lines[++lineNumber];

    // Each iteration should process the current line
    // An iteration could process more than one line. 
    // lineNumber should be advanced accordingly.


    /////////////////////
    // Process comments 
    /////////////////////

    // Strip oneline comments
    if (line.includes("#")) {
      line = line.substring(0, line.indexOf("#"));
    }


    // console.log(line);
    continueProcessing = true;


    ////////////////////
    // Process imports
    ////////////////////

    let reImport = new RegExp('^\\s*import\\s+[(]?\\s*(.*?)\\s*[)]?\\s*$');
    // Matches:
    // - 'import time'
    // - 'import time as t'
    // - 'import ( date, datetime )'

    if ((match = reImport.exec(line)) != null) {
      let names = match[1];
      for (let name of names.split(',')) {
        name = name.trim();
        if (name.includes(' as ')) {
          [moduleName, shortName] = name.split(' as ');
        } else {
          shortName = name;
          moduleName = name;
        }
        addModule(moduleName, shortName);
      }
      continueProcessing = false;
    } 
    if (!continueProcessing) continue;


    let reFromImport = new RegExp('^\\s*from\\s+(.*)\\s+import\\s+[(]?\\s*(.*?)\\s*[)]?\\s*$');
    // Matches:
    // - 'from datetime import datetime'
    // - 'from __future__ import (absolute_import, division, print_function)'
    // - 'from hashlib import md5 as mda'

    if ((match = reFromImport.exec(line)) != null) {
      let moduleName = match[1];
      let typeName = match[2];
      for (let type of typeName.split(',')) {
        type = type.trim();
        if (type.includes(' as ')) {
          [typeName, shortName] = type.split(' as ');
        } else {
          [typeName, shortName] = [type, type];
        }
        addModule(moduleName + "." + typeName, shortName);
      }
      continueProcessing = false;
    } 
    if (!continueProcessing) continue;



    //////////////////////////////////
    // Process variable declarations
    //////////////////////////////////

    // Matches:
    // - 'q = queue.Queue()'

    let reVariable = new RegExp('^\\s*([a-z][a-zA-Z0-9_]*)\\s*=\\s*((?:[a-z]+[.])*[A-Z][a-zA-Z0-9]*)[(].*?[)]\\s*');
    
    if ((match = reVariable.exec(line)) != null) {
      let variable = match[1];
      let type = match[2];
      addVariable(type, variable);
      continueProcessing = false;
    } 
    
    if (!continueProcessing) continue;


       
    //////////////////////////////
    // Process member references
    //////////////////////////////
    
    // Matches:
    // - 'm.update("this")'
    // - 'net.split(',')'
    // - 'max_end_time = datetime.utcnow() + timedelta(seconds=timeout)'
    
    let reFunc = new RegExp('((?:(?:[A-Za-z][A-Za-z0-9_]*)[.])*(?:[A-Za-z][A-Za-z0-9_]*))[(]', 'g');            // 'sys.exit(1)'
        
    for (let reMember of [reFunc]) {
      while ((match = reMember.exec(line)) != null) {
        let member = match[1];
        addMember(member);      
      }
    }

  }



  /////////////////////
  // Output record(s)
  /////////////////////

  for (let [name, props] of members) {
    let count = props['count'];
    emit({
      "name": name, 
      "count": count
    });
  }

}




bigquery.defineFunction(
  'extract_methods',                      // Name of the function exported to SQL
  ['content'],                            // Names of input columns
  [{'name': 'name',  'type': 'string' },  // Output schema
   {'name': 'count', 'type': 'integer'}],
  pythonParser                            // Reference to JavaScript UDF
);

