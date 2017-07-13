function goParser(r, emit) {


  ////////////////////////
  // Collector variables
  ////////////////////////

  let packages  = new Map(); // "rand"            => "crypto/rand"
  let types     = new Map(); // "Mutex"           => "sync"
  let variables = new Map(); // "lock"            => "Mutex"  
  let members   = new Map(); // "sync.Mutex.lock" => { "package": "sync", "type": "Mutex", "member": "lock", "count": 2 }


  //////////
  // Regex
  //////////

  let reOneLineImport = new RegExp('import\\s+[(]?\\s*(?:([a-z]+)\\s)?"([a-zA-Z0-9/]+)".*[)]?.*');
  // Matches:
  // - 'import   "math"'
  // - 'import s "strconv"'
  // - 'import ( "bytes" )  '
  // - 'import "math/big"'

  let reMultiLineStartImport = new RegExp('^import\\s+[(]?\\s*$');
  let reMultiLineInnerImport = new RegExp('^\\s*(?:([a-z]+)\\s)?"([a-zA-Z0-9/]+)".*$');
  let reMultiLineEndImport = new RegExp('^\\s*[)]\\s*$');
  // Matches:
  // - 'import (\n s "math/big" \n) '
  // - 'import (  \n"errors"\n)'


  // See https://golang.org/ref/spec#Keywords
  const identifiers = [
    "break",     "default",      "func",    "interface",  "select", 
    "case",      "defer",        "go",      "map",        "struct", 
    "chan",      "else",         "goto",    "package",    "switch", 
    "const",     "fallthrough",  "if",      "range",      "type", 
    "continue",  "for",          "import",  "return",     "var"
  ];


  let continueProcessing = true;

  /* Register a new package */
  let addPackage = function(packageName, shortName) {
    if (!shortName) {
      let i = packageName.lastIndexOf("/");
      if (i === -1) {
        shortName = packageName;
      } else {
        shortName = packageName.substring(i + 1);
      }
    }
    packages.set(shortName, packageName);
    //console.log("New package " + packageName + " as " + shortName);
  };

  /* Register a new variable */
  let addTypedVariable = function(type, variable) {
    if (type.includes('.')) {
      let packageName = type.substring(0, type.indexOf('.'));
      let typeName = type.substring(type.indexOf('.') + 1);
      types.set(typeName, packageName);
      variables.set(variable, typeName);
      //console.log("New type " + typeName + " in package " + packageName);
      //console.log("New variable " + variable + " of type " + typeName);
    } 
  };

  /* Register a new member */
  let addMember = function(variable, member) {
     //console.log("New member " + variable + "." + member);
     if (variables.has(variable)) {
       type = variables.get(variable);
     } else {
       type = variable;
     }
     if (types.has(type)) {
       package = types.get(type);
       if (packages.has(package)) {
         package = packages.get(package);
         let fullName = package + "." + type + "." + member;
         if (members.has(fullName)) {
           members.get(fullName)['count'] += 1;
         } else {
           members.set(fullName, { "package": package, "type": type, "member": member, "count": 1 });
        }
       }
     } else if (packages.has(type)) {
       package = packages.get(type);
       let fullName = package + "." + member;
       if (members.has(fullName)) {
         members.get(fullName)['count'] += 1;
       } else {
         members.set(fullName, { "package": package, "member": member, "count": 1 });
       }
     } else {
       //console.log("Failed to find " + type + "...");
     }
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
    if (line.includes("//")) {
      line = line.substring(0, line.indexOf("//"));
    }

    // Ignore multiline comments
    if (line.includes("/*")) {
      while (lineNumber + 1 < lines.length && !line.includes("*/")) {
        line = lines[++lineNumber];
      }
      continue; // pass next line
    }

    // console.log(line);


    ////////////////////
    // Process imports
    ////////////////////

    continueProcessing = true;

    if ((match = reOneLineImport.exec(line)) != null) {
      let shortName = match[1];
      let packageName = match[2];
      addPackage(packageName, shortName);
      continueProcessing = false;
    } 


    if ((match = reMultiLineStartImport.exec(line)) != null) {
      while (lineNumber + 1 < lines.length && !lines[lineNumber + 1].match('^\\s*[)]\\s*$')) {
        line = lines[++lineNumber];
        if ((match = reMultiLineInnerImport.exec(line)) != null) {
          let shortName = match[1];
          let packageName = match[2];
          addPackage(packageName, shortName);
        }
      } 
      continueProcessing = false;
    } 
    
    if (!continueProcessing) continue;


    //////////////////////////////////
    // Process variable declarations
    //////////////////////////////////

    // Matches:
    // - 'var (\n  a = 5\n  b = 10\n  c = 15\n)'
    // - 'var (\nToBe bool = false\nMaxInt uint64 = 1<<64 - 1\nz complex128 = cmplx.Sqrt(-5 + 12i)\n)'

    let reVarStartImport = new RegExp('^\\s*type\\s+([A-Za-z][A-Za-z0-9]*)\\s+struct.*$');
    let reVarInnerImport = new RegExp('^\\s*([A-Za-z]+)\\s+([a-zA-Z.]+).*$');
    
    if ((match = reVarStartImport.exec(line)) != null) {
      while (lineNumber + 1 < lines.length && !lines[lineNumber + 1].match('^\\s*[)]\\s*$')) {
        line = lines[++lineNumber];
        if ((match = reVarInnerImport.exec(line)) != null) {
          let variable = match[1];
          let type = match[2];
          addTypedVariable(type, variable);
        }
      } 
      continueProcessing = false;
    } 
    
    if (!continueProcessing) continue;


    //////////////////////////////
    // Process Type declarations
    //////////////////////////////

    let reTypeStartImport = new RegExp('^\\s*type\\s+([A-Za-z][A-Za-z0-9]*)\\s+struct.*$');
    let reTypeInnerImport = new RegExp('^\\s*([A-Za-z]+)\\s+([a-zA-Z.]+).*$');
    
    if ((match = reTypeStartImport.exec(line)) != null) {
      while (lineNumber + 1 < lines.length && !lines[lineNumber + 1].match('^\\s*[}]\\s*$')) {
        line = lines[++lineNumber];
        if ((match = reTypeInnerImport.exec(line)) != null) {
          let variable = match[1];
          let type = match[2];
          addTypedVariable(type, variable);
        }
      } 
      continueProcessing = false;
    } 

    if (!continueProcessing) continue;
    

    //////////////////////////////// 
    // Process Type Instanciations 
    //////////////////////////////// 

    // - 'var c Circle'
    // - 'c := new(Circle)'
    // - 'c := Circle{x: 0, y: 0, r: 5}'
    // - 'c := &Circle{0, 0, 5}'

    for (let re of [
           new RegExp('\\s*var\\s+([a-zA-Z0-9]+)\\s+([a-zA-Z.]+).*'),
           new RegExp('\\s*([a-zA-Z0-9]+)\\s*:=\\s*new[(]([a-zA-Z.]+)[)].*'),
           new RegExp('\\s*([a-zA-Z0-9]+)\\s*:=\\s*&?([a-zA-Z.]+)[{].*'),
        ]) {
      if ((match = re.exec(line)) != null) {
        let variable = match[1];
        let type = match[2];
        addTypedVariable(type, variable); 
      } 
    }


    
    //////////////////////////////
    // Process func declarations
    //////////////////////////////
    
    // Matches:
    // - 'func WorkWithFiles(fd int, name string) *os.File {'
    
    let reFunc = new RegExp('^.*func\\s+[A-Za-z][A-Za-z0-9]*[(](.*?)[)].*');
    let reParam = new RegExp('^([A-Za-z][A-Za-z0-9]*)\\s+([A-Za-z][A-Za-z0-9]*)$');
        
    if ((match = reFunc.exec(line)) != null) {
      let parameters = match[1];
      if (parameters) {
        for (let param of parameters.split(',')) {
          if ((match = reParam.exec(param.trim())) != null) {
            let variable = match[1]; 
            let type = match[2];
            addTypedVariable(type, variable);
          }
        } 
      }
    }


    //////////////////////////////
    // Process member references
    //////////////////////////////

    // Matches:
    // - 'math.Sqrt(a*a + b*b)'

    let reMember = new RegExp('([A-Za-z][A-Za-z0-9]*)[.]([A-Za-z][A-Za-z0-9]*)[(].*[)]', 'g');
        
    while ((match = reMember.exec(line)) != null) {
      let variable = match[1];
      let member = match[2];
      addMember(variable, member);
    }
    
  }


  /////////////////////
  // Output record(s)
  /////////////////////
  for (let [name, props] of members) {
    let package = props['package'];
    let type = props['type'];
    let member = props['member'];
    let count = props['count'];
    if (type) {
      member = type + "." + member;
    }
    emit({
      "package": package, 
      "member": member, 
      "count": count
    });
  }

}



bigquery.defineFunction(
  'extract_methods',                        // Name of the function exported to SQL
  ['content'],                              // Names of input columns
  [{'name': 'package', 'type': 'string' },  // Output schema
   {'name': 'member',  'type': 'string' },
   {'name': 'count',   'type': 'integer'}],
  goParser                                  // Reference to JavaScript UDF
);

