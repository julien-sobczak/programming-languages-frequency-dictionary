function javaParser(r, emit) {

  let types = new Map();     // "Type name" => "Fully-Qualified Name"
  let variables = new Map(); // "Variable name" => "Type name"  
  let members = new Map();   // "FQN.member" => { "fqn": ..., "type": ..., "count": <occurrence> }


  let reImport = new RegExp('import ([a-zA-Z.]+);.*', 'g');
  let reImportStatic = new RegExp('import static ([a-zA-Z.]+);.*', 'g');
  let variableDeclaration = new RegExp('([A-Z][A-Za-z]*)(?:<.*>)? +([a-z][A-Za-z]*)', 'g');
  let memberCall = new RegExp('([a-z][A-Za-z]*)[.]+([a-z][A-Za-z_]*)', 'g');
  let staticMethodCall = new RegExp('([A-Z][A-Za-z]*)[.]+([a-z][A-Za-z]*)[(]', 'g');
  let staticVariableCall = new RegExp('([A-Z][A-Za-z]*)[.]+([A-Z_]+)', 'g');


  const identifiers = ["Appendable", "AutoCloseable", "CharSequence", "Cloneable", "Comparable",
    "Iterable", "Readable", "Runnable", "Thread", "Boolean", "Byte", "Character", "Class",
    "ClassLoader", "ClassValue", "Compiler", "Double", "Enum", "Float", "InheritableThreadLocal",
    "Integer", "Long", "Math", "Number", "Object", "Package", "Process", "ProcessBuilder",
    "Runtime", "RuntimePermission", "SecurityManager", "Short", "StackTraceElement", "StrictMath",
    "String", "StringBuffer", "StringBuilder", "System", "Thread", "ThreadGroup", "ThreadLocal",
    "Throwable", "Void", "Character", "ArithmeticException", "ArrayIndexOutOfBoundsException",
    "ArrayStoreException", "ClassCastException", "ClassNotFoundException", "CloneNotSupportedException",
    "EnumConstantNotPresentException", "Exception", "IllegalAccessException", "IllegalArgumentException",
    "IllegalMonitorStateException", "IllegalStateException", "IllegalThreadStateException",
    "IndexOutOfBoundsException", "InstantiationException", "InterruptedException", "NegativeArraySizeException",
    "NoSuchFieldException", "NoSuchMethodException", "NullPointerException", "NumberFormatException",
    "ReflectiveOperationException", "RuntimeException", "SecurityException", "StringIndexOutOfBoundsException",
    "TypeNotPresentException", "UnsupportedOperationException", "AbstractMethodError", "AssertionError",
    "BootstrapMethodError", "ClassCircularityError", "ClassFormatError", "Error", "ExceptionInInitializerError",
    "IllegalAccessError", "IncompatibleClassChangeError", "InstantiationError", "InternalError",
    "LinkageError", "NoClassDefFoundError", "NoSuchFieldError", "NoSuchMethodError", "OutOfMemoryError",
    "StackOverflowError", "ThreadDeath", "UnknownError", "UnsatisfiedLinkError", "UnsupportedClassVersionError",
    "VerifyError", "VirtualMachineError", "Deprecated", "Override", "SafeVarargs", "SuppressWarnings"];

  let insideMultilineComment = false;
  let continueProcessing = true;

  for (let line of r.content.split("\n")) {

    // Ignore comments
    if (insideMultilineComment) {
      if (line.includes("*/")) {
        insideMultilineComment = false;
      }
      continue; 
    }
    if (line.includes("//")) {
      line = line.substring(0, line.indexOf("//"));
    }
    if (line.includes("/*")) {
      insideMultilineComment = true;
      continue; // pass next line
    }


    // console.log(line);

    continueProcessing = true;

    while ((match = reImport.exec(line)) != null) {
      let fqn = match[1];
      let name = fqn.substring(fqn.lastIndexOf('.') + 1);
      if (name != '*') {
        console.log("New type " + fqn);
        types.set(name, fqn);
      }
      continueProcessing = false;
    } 

    while (continueProcessing && (match = reImportStatic.exec(line)) != null) {
      let importValue = match[1];
      let member = importValue.substring(importValue.lastIndexOf('.') + 1);
      if (member != '*') {
        let fqn = importValue.substring(0, importValue.lastIndexOf('.'));
        let name = fqn.substring(fqn.lastIndexOf('.') + 1);
        types.set(name, fqn);
        let fullName = fqn + "." + member;
        console.log("New member " + fullName);
        members.set(fullName, { "fqn": fqn, "member": member, "count": 1 });
      }
      continueProcessing = false;
    } 
    
    if (!continueProcessing) {
      continue;
    }

    while ((match = variableDeclaration.exec(line)) != null) {
//      console.log("[" + match[0] + "]");
      let type = match[1];
      let variable = match[2];
      let validType = types.has(type);
      if (identifiers.indexOf(type) !== -1) {
        validType = true;
        types.set(type, "java.lang." + type);
      }
      if (validType) {
        console.log("New variable " + variable + " of type " + type);
        variables.set(variable, type);  
      }
    } 

    for (let regex of [memberCall]) {
      while ((match = regex.exec(line)) != null) {
// console.log("[" + match[0] + "]");
        let variable = match[1];
        let member = match[2];
        if (variables.has(variable)) {
          let type = variables.get(variable);
          let fqn = types.get(type);
          let fullName = fqn + "." + member;
          if (!members.has(fullName)) {
            console.log("New member " + fullName);
            members.set(fullName, { "fqn": fqn, "member": member, "count": 1 });
          } else {
            console.log("Existing member " + fullName);
            members.get(fullName)['count'] = members.get(fullName)['count'] + 1;
          }        
        }
      }
    }

    for (let regex of [staticMethodCall, staticVariableCall]) {
      while ((match = regex.exec(line)) != null) {
        let type = match[1];
        let member = match[2];
        let fqn;
        let validType = false;
        if (types.has(type)) {
          fqn = types.get(type);
          validType = true;
        } else if (identifiers.indexOf(type) !== -1) {
          fqn = "java.lang." + type;
          types.set(type, fqn);
          validType = true;
        }
        if (validType) {
          let fullName = fqn + "." + member;
          if (!members.has(fullName)) {
            console.log("New member " + fullName);
            members.set(fullName, { "fqn": fqn, "member": member, "count": 1 });
          } else {
            console.log("Existing member " + fullName);
            members.get(fullName)['count'] = members.get(fullName)['count'] + 1;
          }        
        }
      }
    }

  }

  for (let [name, props] of members) {
    let fqn = props['fqn'];
    let member = props['member'];
    let count = props['count'];
    let isConstant = /[A-Z]/.test(member[0]);
    let memberType = isConstant ? "variable" : "method";
    emit({
      "fqn": fqn, 
      "member": member, 
      "type": memberType, 
      "count": count
    });
  }
}



bigquery.defineFunction(
  'extract_methods',                       // Name of the function exported to SQL
  ['content'],                             // Names of input columns
  [{'name': 'fqn',    'type': 'string' },  // Output schema
   {'name': 'member', 'type': 'string' },
   {'name': 'type',   'type': 'string' },
   {'name': 'count',  'type': 'integer'}],
  javaParser                               // Reference to JavaScript UDF
);  
    


